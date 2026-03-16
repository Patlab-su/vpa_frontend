import React, { useEffect, useState, useCallback } from "react";
import axios from "../services/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown, FileText, AlertTriangle, History } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

const COLORS = ["#2563eb", "#8b5cf6", "#f97316", "#10b981", "#06b6d4"];

const TYPE_LABEL = {
  Materials: "ค่าวัสดุก่อสร้าง",
  Labor: "ค่าแรงคนงาน",
  Equipment: "ค่าเช่าอุปกรณ์",
  Transportation: "ค่าขนส่ง",
  Utilities: "ค่าสาธารณูปโภค",
  Other: "อื่นๆ",
};

const ExpenseSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("all");
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ป้องกันสิทธิ์ Foreman
  if (user?.role === "Foreman") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-xl font-black text-gray-800 mb-2">เข้าถึงไม่ได้</h1>
        <p className="text-gray-500 mb-6 px-10">คุณไม่มีสิทธิ์เข้าถึงรายงานสรุปค่าใช้จ่าย</p>
        <button onClick={() => navigate("/dashboard")} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-200">
          กลับไปหน้าหลัก
        </button>
      </div>
    );
  }

  // 1. โหลดรายชื่อ Site (ทำแค่ครั้งเดียวตอนเปิดหน้า)
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await axios.get(`/api/sites`);
        setSites(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching sites", err);
      }
    };
    fetchSites();
  }, []);

  // 2. ฟังก์ชันโหลดข้อมูลกราฟ (ใช้ useCallback เพื่อไม่ให้สร้างฟังก์ชันใหม่ซ้ำๆ จน Loop)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ สร้าง params object ที่สะอาด (ไม่ส่งค่าว่าง/undefined ไปกวน Server)
      const params = {};
      if (siteId && siteId !== "all") params.site_id = siteId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axios.get(`/api/expenses/summary`, { params });
      
      const mapped = (res.data?.data || []).map((d, i) => ({
        name: TYPE_LABEL[d.expense_type] || d.expense_type,
        value: parseFloat(d.total_amount || 0),
        color: COLORS[i % COLORS.length],
      }));
      
      setData(mapped);
      setTotal(mapped.reduce((sum, d) => sum + d.value, 0));
    } catch (err) {
      console.error("Fetch Summary Error:", err);
      // ไม่แสดง Error หน้าจอเพื่อความสวยงาม แต่ Log ไว้ดู
    } finally {
      setLoading(false);
    }
  }, [siteId, startDate, endDate]); // ✅ Dependency ที่ถูกต้อง: โหลดใหม่เมื่อ 3 ตัวนี้เปลี่ยนเท่านั้น

  // 3. เรียก fetchData เมื่อมีการเปลี่ยน Filter
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. ฟังก์ชัน Export (ใช้ Logic เดียวกับ fetchData เพื่อป้องกัน Error 400)
  const handleExportSummary = async () => {
    if (total === 0) return;

    Swal.fire({ 
      title: 'กำลังสร้างรายงาน...', 
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false, 
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const params = {};
      if (siteId && siteId !== "all") params.site_id = siteId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axios.get(`/api/reports/expense-summary-export`, { 
        params,
        responseType: "blob" 
      });

      // สร้าง Link สำหรับ Download
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0,10);
      link.download = `Expense_Summary_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      Swal.close();
      
      // แจ้งเตือนสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'ดาวน์โหลดสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (e) {
      console.error(e);
      Swal.fire('ผิดพลาด', 'ไม่สามารถส่งออกรายงานได้', 'error');
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-100 p-3 rounded-2xl shadow-xl">
          <p className="font-bold text-gray-800 text-xs">{payload[0].name}</p>
          <p className="text-blue-600 font-black text-sm">{payload[0].value.toLocaleString()} ฿</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-4 h-16 flex items-center justify-center relative">
          <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">
            สรุปรายละเอียดค่าใช้จ่าย
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 py-6 space-y-6">
        {/* Company Title */}
        <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-blue-900 leading-none">บริษัท รับเหมาก่อสร้าง</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">* แสดงเฉพาะบิลที่อนุมัติแล้ว</p>
        </div>

        {/* Site Selection Card */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">เลือกไซต์งาน</label>
                <button 
                  onClick={() => navigate(siteId === "all" ? "/expenses" : `/sites/${siteId}/expenses`)}
                  className="flex items-center gap-1.5 text-blue-600 text-xs font-black hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all"
                >
                  <History className="w-3.5 h-3.5" />
                  ดูประวัติบิล
                </button>
            </div>
            <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 appearance-none"
            >
                <option value="all">ทุกไซต์งานทั้งหมด</option>
                {sites.map((s) => (
                    <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                ))}
            </select>
        </div>

        {/* Chart Area */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden h-72 relative">
            {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm font-bold">กำลังประมวลผล...</div>
            ) : data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                    <AlertTriangle className="w-8 h-8 opacity-20" />
                    <p className="text-xs font-bold uppercase">ไม่พบข้อมูลในช่วงเวลานี้</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" paddingAngle={4}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            )}
            {/* Total Center Overlay */}
            {!loading && total > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">รวมทั้งสิ้น</p>
                    <p className="text-xl font-black text-blue-900 leading-none">{(total/1000).toFixed(1)}k</p>
                </div>
            )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase ml-1">เริ่มจาก</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold text-gray-700 bg-transparent outline-none" />
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col gap-1">
                <span className="text-[10px] font-black text-gray-400 uppercase ml-1">ถึงวันที่</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold text-gray-700 bg-transparent outline-none" />
            </div>
        </div>

        {/* Legend List */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            {data.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center px-6 py-4 ${idx !== data.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-blue-600">{item.value.toLocaleString()} ฿</span>
                </div>
            ))}
            <div className="bg-blue-50 px-6 py-5 flex justify-between items-center">
                <span className="text-xs font-black text-blue-900 uppercase tracking-widest">ยอดรวมทั้งหมด</span>
                <span className="text-lg font-black text-blue-600">
                    {total.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 })}
                </span>
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleExportSummary}
            disabled={total === 0 || loading}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${total === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm hover:bg-blue-50'}`}
          >
            <FileDown className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => navigate("/expenses/pending")}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            บิลรออนุมัติ
          </button>
        </div>
      </div>

      <BottomNav active="summary" />
    </div>
  );
};

export default ExpenseSummary;