// src/pages/ExpensesReport.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/api";
import { ChevronLeft, Plus, AlertTriangle } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext"; 

const TYPE_LABEL = {
  Materials: "ค่าวัสดุก่อสร้าง",
  Labor: "ค่าแรงคนงาน",
  Equipment: "ค่าเช่าอุปกรณ์",
  Transportation: "ค่าขนส่ง",
  Utilities: "ค่าสาธารณูปโภค",
  Other: "อื่นๆ",
};

export default function ExpensesReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, sumRes, siteRes] = await Promise.all([
        axios.get(`/api/expenses?site_id=${id}`),
        axios.get(`/api/expenses/summary?site_id=${id}`),
        axios.get(`/api/sites/${id}`),
      ]);
      setExpenses(expRes.data?.data || []);
      setSummary(sumRes.data?.data || []);
      setSite(siteRes.data?.data || null);
    } catch (e) {
      console.error("โหลดข้อมูลค่าใช้จ่ายผิดพลาด:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "Foreman") {
      loadData();
    } else {
      setLoading(false);
    }
  }, [id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

  if (loading) return <div className="p-4 text-center text-gray-500">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-screen-sm mx-auto px-4 py-3 flex items-center relative h-16">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>กลับ</span>
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-black text-gray-800 whitespace-nowrap">
            รายงานค่าใช้จ่าย
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-screen-sm px-4 py-6 space-y-8">
        {/* Site Info */}
        {site && (
          <div className="mb-2">
            <h2 className="text-xl font-black text-blue-900 leading-tight">
              {site.site_name}
            </h2>
            {site.site_address && (
              <p className="text-gray-500 text-sm mt-1">{site.site_address}</p>
            )}
          </div>
        )}

        {/* 🚫 Foreman Access Control */}
        {user?.role === "Foreman" ? (
          <div className="flex flex-col items-center text-center py-16 bg-gray-50 rounded-[2.5rem] px-6 border border-gray-100 shadow-inner">
            <div className="bg-red-50 p-4 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-red-600 mb-2">
              คุณไม่มีสิทธิ์ดูรายละเอียดค่าใช้จ่าย
            </h2>
            <p className="text-gray-500 text-sm">
              คุณสามารถเพิ่มบิลค่าใช้จ่ายใหม่เพื่อส่งคำขออนุมัติได้ที่ปุ่มด้านล่าง
            </p>
          </div>
        ) : (
          <>
            {/* Note */}
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">
              * แสดงเฉพาะบิลที่อนุมัติแล้ว
            </p>

            {/* Summary by type */}
            <div>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
                สรุปตามประเภท
              </h2>
              {summary.length === 0 ? (
                <div className="text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  ไม่มีข้อมูลค่าใช้จ่าย
                </div>
              ) : (
                <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {summary.map((s, index) => (
                    <div
                      key={s.expense_type}
                      className={`flex justify-between py-4 px-6 text-sm ${
                        index !== summary.length - 1 ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <span className="font-bold text-gray-600">
                        {TYPE_LABEL[s.expense_type] || s.expense_type}
                      </span>
                      <span className="text-blue-600 font-black">
                        {Number(s.total_amount).toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense List */}
            <div>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">
                ทุกรายการ
              </h2>
              {expenses.length === 0 ? (
                <div className="text-gray-400 text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  ไม่มีรายการค่าใช้จ่าย
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((e) => (
                    <div
                      key={e.expense_id}
                      className="border border-gray-100 rounded-[2rem] p-5 bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md tracking-tighter">
                          {TYPE_LABEL[e.expense_type] || e.expense_type}
                        </span>
                        <span className="text-[11px] font-bold text-gray-400">
                          {e.expense_date
                            ? new Date(e.expense_date).toLocaleDateString("th-TH")
                            : "-"}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800">{e.description || "-"}</p>
                      <div className="flex justify-between items-end mt-4">
                        <span className="text-xs font-bold text-gray-400 italic">
                          {e.vendor_name ? `@ ${e.vendor_name}` : ""}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-black text-blue-900">
                            {Number(e.amount).toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <span className={`text-[10px] font-bold uppercase ${
                            e.status === "Approved" ? "text-green-500" : 
                            e.status === "Rejected" ? "text-red-500" : "text-orange-500"
                          }`}>
                            {e.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Grand Total Footer */}
              <div className="mt-8 p-6 bg-blue-900 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-blue-900/20">
                <span className="font-bold text-sm uppercase tracking-widest">รวมค่าใช้จ่ายทั้งสิ้น</span>
                <span className="text-2xl font-black">
                  {total.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ✅ ปุ่มเพิ่มบิล (Floating Action Button) */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => navigate(`/sites/${id}/expenses/add`)}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-black shadow-[0_12px_30px_rgba(37,99,235,0.4)] hover:bg-blue-700 active:scale-95 transition-all border-2 border-white/20 whitespace-nowrap"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>เพิ่มบิลค่าใช้จ่าย</span>
        </button>
      </div>

      <BottomNav active="expenses" />
    </div>
  );
}