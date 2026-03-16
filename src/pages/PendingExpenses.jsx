// src/pages/PendingExpenses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  LayoutGrid, 
  Tag, 
  Search, 
  Image as ImageIcon,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_BASE;

const TYPE_LABEL = {
  Materials: "ค่าวัสดุก่อสร้าง",
  Labor: "ค่าแรงคนงาน",
  Equipment: "ค่าเช่าอุปกรณ์",
  Transportation: "ค่าขนส่ง",
  Utilities: "ค่าสาธารณูปโภค",
  Other: "อื่นๆ",
};

export default function PendingExpenses() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const loadSites = async () => {
    try {
      const res = await axios.get(`/api/sites`);
      setSites(res.data?.data || []);
    } catch (e) {
      console.error("load sites error", e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = { status: "Pending" };
      if (siteId && siteId !== "all") params.site_id = siteId;

      const res = await axios.get(`/api/expenses`, { params });
      setItems(res.data?.data || []);
    } catch (e) {
      console.error("load pending expenses error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSites(); }, []);
  useEffect(() => { loadData(); }, [siteId]);

  // ✅ สรุปยอดเงินบิลที่กรองแล้ว
  const filteredItems = useMemo(() => {
    return items.filter((exp) => {
      const lowerSearch = searchTerm.toLowerCase();
      return !searchTerm || 
        (exp.description && exp.description.toLowerCase().includes(lowerSearch)) ||
        (exp.amount && String(exp.amount).includes(lowerSearch));
    });
  }, [items, searchTerm]);

  const total = useMemo(
    () => filteredItems.reduce((s, it) => s + Number(it.amount || 0), 0),
    [filteredItems]
  );

  // ✅ SweetAlert2 สำหรับอนุมัติ
  const handleApprove = (expenseId) => {
    Swal.fire({
      title: 'ยืนยันการอนุมัติ?',
      text: "คุณต้องการอนุมัติบิลใบนี้ใช่หรือไม่",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ใช่, อนุมัติเลย',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`/api/expenses/${expenseId}/approve`);
          Swal.fire({ icon: 'success', title: 'อนุมัติเรียบร้อย', timer: 1500, showConfirmButton: false });
          setItems((prev) => prev.filter((x) => x.expense_id !== expenseId));
        } catch (e) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถอนุมัติได้', 'error');
        }
      }
    });
  };

  // ✅ SweetAlert2 สำหรับปฏิเสธ (แบบใส่เหตุผล)
  const handleReject = (expenseId) => {
    Swal.fire({
      title: 'ปฏิเสธบิลนี้?',
      text: 'ระบุเหตุผลในการปฏิเสธ (ถ้ามี):',
      input: 'textarea',
      inputPlaceholder: 'ใส่เหตุผลของคุณที่นี่...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'ยืนยันการปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(`/api/expenses/${expenseId}/reject`, { reason: result.value });
          Swal.fire({ icon: 'success', title: 'ปฏิเสธบิลเรียบร้อย', timer: 1500, showConfirmButton: false });
          setItems((prev) => prev.filter((x) => x.expense_id !== expenseId));
        } catch (e) {
          Swal.fire('ผิดพลาด', 'ไม่สามารถปฏิเสธได้', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header & Filters Section */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-sm mx-auto h-16 flex items-center px-4 relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-xl transition"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>Back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-md font-black text-gray-800 whitespace-nowrap uppercase tracking-tight">
            บิลที่รอการอนุมัติ
          </h1>
        </div>

        {/* Search Bar */}
        <div className="max-w-screen-sm mx-auto px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="ค้นหาบิลที่รอตรวจ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-[11px] font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Site Filter Section */}
        <div className="max-w-screen-sm mx-auto px-4 pb-3 flex items-center gap-2 border-t border-gray-50 pt-3">
          <div className="relative flex-1">
            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-[11px] font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
            >
              <option value="all">ทุกไซต์งานทั้งหมด</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
              ))}
            </select>
          </div>
          <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl uppercase tracking-tighter">
            {filteredItems.length} บิลรอตรวจ
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="max-w-screen-sm mx-auto px-4 pt-6 space-y-5">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold text-xs uppercase animate-pulse">กำลังโหลดบิล...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
            <Clock className="w-12 h-12 text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold text-sm">ไม่มีบิลรออนุมัติ</p>
          </div>
        ) : (
          filteredItems.map((exp) => (
            <div
              key={exp.expense_id}
              className="bg-white rounded-[2rem] border border-gray-50 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md tracking-wider">
                      {TYPE_LABEL[exp.expense_type] || exp.expense_type}
                    </span>
                    <h3 className="text-lg font-black text-gray-800 leading-tight">
                        {Number(exp.amount).toLocaleString()} ฿
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-orange-50 text-orange-600">
                    <Clock className="w-3 h-3" />
                    Pending
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ไซต์งาน</p>
                        <p className="text-xs font-bold text-blue-900 truncate">{exp.site_name || "-"}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">วันที่ขอเบิก</p>
                        <p className="text-xs font-bold text-gray-700">
                            {exp.created_at ? new Date(exp.created_at).toLocaleDateString("th-TH") : "-"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ผู้ขอเบิก</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{exp.requested_by_name || "-"}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ร้านค้า/ผู้ขาย</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{exp.vendor_name || "-"}</p>
                    </div>
                </div>

                {/* Description */}
                {exp.description && (
                  <div className="flex gap-2 items-start px-1">
                    <div className="w-1 h-8 bg-orange-100 rounded-full" />
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      <span className="font-black text-gray-400 uppercase text-[9px] block">หมายเหตุ/รายละเอียด:</span>
                      {exp.description}
                    </p>
                  </div>
                )}

                {/* Receipt button */}
                {exp.receipt_image && (
                  <button
                    onClick={() => setPreviewImage(`${API}${exp.receipt_image}`)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    ตรวจสอบใบเสร็จ / รูปภาพ
                  </button>
                )}

                {/* Action Buttons (Restricted by Role) */}
                {["admin", "CEO", "secretary"].includes(user?.role?.toLowerCase()) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(exp.expense_id)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4" /> อนุมัติบิล
                    </button>
                    <button
                      onClick={() => handleReject(exp.expense_id)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
                    >
                      <X className="w-4 h-4" /> ปฏิเสธบิล
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Floating Summary Footer */}
        {filteredItems.length > 0 && (
          <div className="bg-blue-900 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-200 flex justify-between items-center">
            <div className="space-y-0.5">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">ยอดรวมรออนุมัติ</p>
                <p className="text-xs text-blue-100 opacity-70">เฉพาะบิลที่ปรากฏตาม Filter</p>
            </div>
            <div className="text-xl font-black">
                {total.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                  maximumFractionDigits: 0,
                })}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal (Modern Overlay) */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <button className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20">
             <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <BottomNav active="summary" />
    </div>
  );
}