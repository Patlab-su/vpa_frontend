import React, { useState, useEffect } from "react";
import axios from "../services/api";
import { useNavigate } from "react-router-dom";
// เอา DollarSign ออกจากบรรทัด import ด้านล่างนี้นะครับ
import { ArrowLeft, Search, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react";
import BottomNav from "../components/BottomNav";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const IncomeHistory = () => {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        // รอ Backend API: GET /api/incomes
        const res = await axios.get("/api/incomes");
        setIncomes(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Error fetching incomes history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomes();
  }, []);

  const filteredIncomes = incomes.filter((inc) => {
    const name = inc.site_name || inc.custom_company_name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-4 h-16 flex items-center relative">
          <button 
            onClick={() => navigate("/incomes/summary")}
            className="absolute left-4 p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="w-full text-center text-lg font-black uppercase tracking-tight">ประวัติรายรับทั้งหมด</h1>
        </div>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 py-6 space-y-4">
        
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท หรือ ไซต์งาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-full pl-12 pr-4 py-3.5 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-100 shadow-sm"
          />
        </div>

        {/* List of Incomes */}
        {loading ? (
          <div className="text-center py-10 text-gray-400 font-bold">กำลังโหลดข้อมูล...</div>
        ) : filteredIncomes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-bold uppercase text-sm">ไม่พบประวัติรายรับ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncomes.map((inc) => (
              <div key={inc.income_id || inc.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-gray-800 text-base">
                      {inc.site_name || inc.custom_company_name || "ไม่ระบุ"}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mt-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>โอน: {inc.transfer_date ? dayjs(inc.transfer_date).format("DD MMM YYYY") : "-"}</span>
                      {inc.check_date && (
                        <>
                          <span className="mx-1">•</span>
                          <span>เช็ค: {dayjs(inc.check_date).format("DD MMM YYYY")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    
                    <p className="text-lg font-black text-green-600 flex items-center justify-end gap-1">
                      {parseFloat(inc.amount).toLocaleString()} ฿
                    </p>
                  </div>
                </div>

                {/* Footer of Card: ผู้บันทึก & สลิป */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    บันทึกโดย: <span className="text-gray-600">{inc.recorded_by_name || "Unknown"}</span>
                  </span>
                  
                  {inc.slip_image_url && (
                    <a 
                      href={`${import.meta.env.VITE_API_URL || ""}${inc.slip_image_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition"
                    >
                      <ImageIcon className="w-3 h-3" /> ดูสลิป
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="incomes" />
    </div>
  );
};

export default IncomeHistory;