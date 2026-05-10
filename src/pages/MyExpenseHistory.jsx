// src/pages/MyExpenseHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import { 
  ChevronLeft, Filter, LayoutGrid, CheckCircle2, 
  XCircle, Clock, Search, ImageIcon, X, Tag 
} from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

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

export default function MyExpenseHistory() {
  const navigate = useNavigate();
  const { user } = useAuth(); // เอาข้อมูล user ที่ล็อกอินอยู่มาใช้
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับ Filter และ Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State สำหรับพรีวิวรูปใบเสร็จ
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchMyExpenses = async () => {
      try {
        setLoading(true);
        const params = {};
        
        // ถ้ามีการเลือกแท็บสถานะ ให้ส่ง params ไปกรอง
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        // ดึงข้อมูลบิลทั้งหมด
        const res = await axios.get(`/api/expenses`, { params });
        const allExpenses = res.data?.data || [];

        // 🌟 จุดสำคัญ: กรองเอา "เฉพาะบิลที่ User คนนี้เป็นคนสร้าง (requested_by)"
        const myOnlyExpenses = allExpenses.filter(
          (exp) => String(exp.requested_by) === String(user?.user_id)
        );

        setExpenses(myOnlyExpenses);
      } catch (err) {
        console.error("Error fetching my expenses", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_id) {
      fetchMyExpenses();
    }
  }, [statusFilter, user]); 

  // Logic กรองข้อมูลฝั่ง Client (สำหรับการค้นหา)
  const filteredExpenses = expenses.filter((exp) => {
    const lowerSearch = searchTerm.toLowerCase();
    return !searchTerm || 
      (exp.description && exp.description.toLowerCase().includes(lowerSearch)) ||
      (exp.site_name && exp.site_name.toLowerCase().includes(lowerSearch)) ||
      (exp.amount && String(exp.amount).includes(lowerSearch));
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      {/* Header Section */}
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
            ประวัติการเบิกจ่ายของฉัน
          </h1>
        </div>

        {/* Search Bar */}
        <div className="max-w-screen-sm mx-auto px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="ค้นหาชื่อไซต์งาน, หมายเหตุ หรือยอดเงิน..."
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
            { id: "Pending", label: "รอตรวจสอบ", icon: <Clock className="w-3 h-3"/> },
            { id: "Approved", label: "อนุมัติ", icon: <CheckCircle2 className="w-3 h-3"/> },
            { id: "Rejected", label: "ไม่อนุมัติ", icon: <XCircle className="w-3 h-3"/> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black transition-all whitespace-nowrap ${
                statusFilter === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="max-w-screen-sm mx-auto px-4 pt-6 space-y-5">
        <div className="flex justify-between items-end px-1">
            <h2 className="text-sm font-black text-gray-800">รายการบิลของคุณ</h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredExpenses.length} รายการ</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold text-xs uppercase animate-pulse">กำลังโหลดข้อมูล...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
            <Filter className="w-12 h-12 text-gray-100 mb-4" />
            <p className="text-gray-400 font-bold text-sm">ไม่พบประวัติการเบิกจ่ายของคุณ</p>
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
                        <p className="text-xs font-bold text-blue-900 truncate">{exp.site_name || "ไม่ระบุ"}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">วันที่ขอเบิก</p>
                        <p className="text-xs font-bold text-gray-700">
                            {exp.created_at ? new Date(exp.created_at).toLocaleDateString("th-TH") : "-"}
                        </p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ผู้สร้างบิล</p>
                        <p className="text-xs font-bold text-blue-600 truncate">คุณ (ตัวฉัน)</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ผู้ตรวจสอบ</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{exp.approved_by_name || "รอตรวจสอบ"}</p>
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

                {/* ✅ ส่วนแสดงเหตุผลที่ไม่อนุมัติ (ถ้ามี) */}
                {exp.status?.toLowerCase() === 'rejected' && (exp.rejection_reason || exp.reason) && (
                  <div className="flex gap-2 items-start px-1 mt-2 p-3 bg-red-50/50 rounded-xl border border-red-100">
                    <div className="w-1 h-8 bg-red-400 rounded-full" />
                    <p className="text-xs text-red-600 leading-relaxed font-medium">
                      <span className="font-black text-red-400 uppercase text-[9px] block">เหตุผลที่ถูกปฏิเสธ:</span>
                      {exp.rejection_reason || exp.reason}
                    </p>
                  </div>
                )}

                {/* ปุ่มพรีวิวใบเสร็จ */}
                {exp.receipt_image && (
                  <div className="pt-3 border-t border-gray-50 mt-4">
                    <button
                      onClick={() => setPreviewImage(`${API}${exp.receipt_image}`)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      ตรวจสอบใบเสร็จ / รูปภาพ
                    </button>
                  </div>
                )}
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

      {/* ✅ ใส่ BottomNav เพื่อให้มีแถบเมนูด้านล่าง */}
      <BottomNav />
    </div>
  );
}