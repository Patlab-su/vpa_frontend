// src/pages/ExpenseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/api";
import { ChevronLeft, Filter, Tag, LayoutGrid, CheckCircle2, XCircle, Clock, Search, ImageIcon, X } from "lucide-react";
import ExpenseTimeline from "../components/ExpenseTimeline";
import BottomNav from "../components/BottomNav";

const API = import.meta.env.VITE_API_BASE;

const TYPE_LABEL = {
  all: "ทุกประเภท",
  Materials: "ค่าวัสดุก่อสร้าง",
  Labor: "ค่าแรงคนงาน",
  Equipment: "ค่าเช่าอุปกรณ์",
  Transportation: "ค่าขนส่ง",
  Utilities: "ค่าสาธารณูปโภค",
  Other: "อื่นๆ",
};

const statusLabel = (status) => {
  if (!status) return '';
  switch(status.toLowerCase()) {
    case 'approved': return 'อนุมัติ';
    case 'rejected': return 'ไม่อนุมัติ';
    case 'pending': return 'รอการอนุมัติ';
    default: return status;
  }
};

export default function ExpenseDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับ Filter และ Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State สำหรับพรีวิวรูปใบเสร็จ
  const [previewImage, setPreviewImage] = useState(null);

  // ✅ แก้ไขส่วน useEffect เพื่อดึงข้อมูล "รอตรวจ" (Pending)
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        
        // 1. กำหนดพารามิเตอร์เริ่มต้น
        const params = {};
        
        // 2. กรองตาม Site (ถ้ามี)
        if (siteId && siteId !== "all") {
          params.site_id = siteId;
        }

        // 3. 🌟 จุดสำคัญ: กรองตามสถานะที่ผู้ใช้เลือก (รวมถึง Pending)
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        // ยิง API พร้อมพารามิเตอร์ status
        const res = await axios.get(`/api/expenses`, { params });
        setExpenses(res.data.data || []);
      } catch (err) {
        console.error("Error fetching expenses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
    // 4. เพิ่ม statusFilter เข้าไปเพื่อให้ระบบดึงข้อมูลใหม่ทุกครั้งที่เปลี่ยนแท็บ
  }, [siteId, statusFilter]); 

  // Logic กรองข้อมูลฝั่ง Client (สำหรับการค้นหา)
  const filteredExpenses = expenses.filter((exp) => {
    const matchType = typeFilter === "all" || exp.expense_type === typeFilter;
    
    const lowerSearch = searchTerm.toLowerCase();
    const matchSearch = 
      !searchTerm || 
      (exp.description && exp.description.toLowerCase().includes(lowerSearch)) ||
      (exp.amount && String(exp.amount).includes(lowerSearch));

    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-sm mx-auto h-16 flex items-center px-4 relative">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-xl transition"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>กลับ</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-md font-black text-gray-800 whitespace-nowrap uppercase tracking-tight">
            ประวัติรายละเอียดบิล
          </h1>
        </div>

        {/* Search Bar */}
        <div className="max-w-screen-sm mx-auto px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="ค้นหาจากหมายเหตุ หรือยอดเงิน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-[11px] font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50">
          {[
            { id: "all", label: "ทั้งหมด", icon: <LayoutGrid className="w-3 h-3"/> },
            { id: "Approved", label: "อนุมัติ", icon: <CheckCircle2 className="w-3 h-3"/> },
            { id: "Rejected", label: "ไม่อนุมัติ", icon: <XCircle className="w-3 h-3"/> },
            
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black transition-all whitespace-nowrap ${
                statusFilter === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                : "bg-white text-gray-400 border border-gray-100"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="max-w-screen-sm mx-auto px-4 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-[11px] font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
                >
                    {Object.entries(TYPE_LABEL).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>
            <div className="text-[10px] font-black text-gray-300 uppercase px-2 tracking-tighter">
                {filteredExpenses.length} รายการ
            </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="max-w-screen-sm mx-auto px-4 pt-6 space-y-5">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold text-xs uppercase animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
            <Filter className="w-12 h-12 text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold text-sm">ไม่พบข้อมูลที่ตรงตามเงื่อนไข</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div
              key={exp.expense_id}
              className="bg-white rounded-[2rem] border border-gray-50 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md tracking-wider">
                      {TYPE_LABEL[exp.expense_type] || exp.expense_type}
                    </span>
                    <h3 className="text-lg font-black text-gray-800 leading-tight">
                        {Number(exp.amount).toLocaleString()} ฿
                    </h3>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${
                    exp.status?.toLowerCase() === 'approved' ? 'bg-green-50 text-green-600' :
                    exp.status?.toLowerCase() === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {exp.status?.toLowerCase() === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {exp.status?.toLowerCase() === 'rejected' && <XCircle className="w-3 h-3" />}
                    {exp.status?.toLowerCase() === 'pending' && <Clock className="w-3 h-3" />}
                    {exp.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ไซต์งาน</p>
                        <p className="text-xs font-bold text-blue-900 truncate">{exp.site_name}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">วันที่ขอเบิก</p>
                        <p className="text-xs font-bold text-gray-700">
                            {exp.created_at ? new Date(exp.created_at).toLocaleDateString("th-TH") : "-"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ผู้สร้างบิล</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{exp.requested_by_name || "-"}</p>
                    </div>
                    <div className="space-y-0.5">
                        {/* เปลี่ยนจาก ผู้อนุมัติ เป็น ผู้ตรวจสอบ */}
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ผู้ตรวจสอบ</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{exp.approved_by_name || "-"}</p>
                    </div>
                </div>

                {/* ส่วนของหมายเหตุปกติ */}
                {exp.description && (
                  <div className="flex gap-2 items-start px-1">
                    <div className="w-1 h-8 bg-blue-100 rounded-full" />
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      <span className="font-black text-gray-400 uppercase text-[9px] block">หมายเหตุ:</span>
                      {searchTerm ? (
                        <span>
                            {exp.description.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchTerm.toLowerCase() 
                                    ? <span key={i} className="bg-yellow-200 text-gray-900 px-1 rounded-sm">{part}</span> 
                                    : part
                            )}
                        </span>
                      ) : (
                        exp.description
                      )}
                    </p>
                  </div>
                )}

                
                {exp.status?.toLowerCase() === 'rejected' && exp.rejection_reason && (
                  <div className="flex gap-2 items-start px-1 mt-2 p-3 bg-red-50/50 rounded-xl border border-red-100">
                    <div className="w-1 h-8 bg-red-400 rounded-full" />
                    <p className="text-xs text-red-600 leading-relaxed font-medium">
                      <span className="font-black text-red-400 uppercase text-[9px] block">เหตุผลที่ไม่อนุมัติ:</span>
                      {exp.rejection_reason}
                    </p>
                  </div>
                )}

                {/* ปุ่มพรีวิวใบเสร็จ */}
                {exp.receipt_image && (
                  <div className="pt-3">
                    <button
                      onClick={() => setPreviewImage(`${API}${exp.receipt_image}`)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      ตรวจสอบใบเสร็จ / รูปภาพ
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-50">
                    <button className="w-full text-[10px] font-black text-blue-600 uppercase tracking-widest py-2 bg-blue-50/50 rounded-xl">
                        แสดงประวัติการดำเนินการ (Logs)
                    </button>
                    <div className="mt-4 px-2">
                        <ExpenseTimeline expenseId={exp.expense_id} />
                    </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
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

      <BottomNav />    </div>
  );
}