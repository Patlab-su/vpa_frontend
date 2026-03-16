// src/pages/SiteDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil, MapPin, Wallet } from "lucide-react"; // ✅ เพิ่ม icon Wallet
import axios from "../services/api";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE;

const TYPE_LABEL = {
  Materials: "ค่าวัสดุก่อสร้าง",
  Labor: "ค่าแรงคนงาน",
  Equipment: "ค่าเช่าอุปกรณ์",
  Transportation: "ค่าขนส่ง",
  Utilities: "ค่าสาธารณูปโภค",
  Other: "อื่นๆ",
};

// ฟังก์ชันจัดรูปแบบเงิน
const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
};

function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full">
      <div
        className="h-3 bg-blue-500 rounded-full transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function MoneyBox({ label, amount, isNegative = false }) {
  const formatted = formatMoney(amount);
  return (
    <div className="flex items-center justify-between border rounded-xl px-4 py-3 bg-white">
      <div className="text-gray-700 text-sm">{label}</div>
      <div className={`font-semibold text-sm ${isNegative ? "text-red-600" : "text-blue-900"}`}>
        {formatted}
      </div>
    </div>
  );
}

const resolveSiteImage = (image_url) => {
  if (!image_url) return "https://picsum.photos/800/400?blur=2";
  const url = String(image_url);
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API}${url}`;
  return `${API}/uploads/sites/${url}`;
};

export default function SiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const [site, setSite] = useState(null);
  const [progress, setProgress] = useState({ overall: 0, breakdown: {} });
  const [latestExpenses, setLatestExpenses] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const [siteRes, progRes, expListRes, expSumRes] = await Promise.all([
          axios.get(`/api/sites/${id}`),
          axios.get(`/api/sites/${id}/progress`),
          axios.get(`/api/expenses?site_id=${id}`),
          axios.get(`/api/expenses/summary?site_id=${id}`),
        ]);

        if (!alive) return;
        setSite(siteRes.data?.data || null);
        setProgress(progRes.data?.data || { overall: 0, breakdown: {} });
        setLatestExpenses(expListRes.data?.data || []);
        setExpenseSummary(expSumRes.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="p-4 text-gray-500">กำลังโหลด...</div>;
  if (!site) return <div className="p-4 text-red-600">ไม่พบข้อมูลไซต์</div>;

  const cover = resolveSiteImage(site.image_url);

  // ✅ คำนวณงบประมาณ
  const totalBudget = Number(site.budget || 0); // ต้องมั่นใจว่า Backend ส่ง budget มาด้วย
  const totalUsed = expenseSummary.reduce((sum, item) => sum + Number(item.total_amount), 0);
  const remainingBudget = totalBudget - totalUsed;
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="min-h-screen bg-white pb-40">
      {/* Top bar */}
      <div className="mx-auto max-w-md md:max-w-2xl px-4 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6 stroke-[3] text-blue-600" />
            <span className="text-lg font-medium text-blue-600">Back</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {site.map_link && (
              <button
                onClick={() => window.open(site.map_link, "_blank")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 text-green-700"
              >
                <MapPin className="w-4 h-4" />
                แผนที่
              </button>
            )}

            {(role === "CEO" || role === "admin") && (
              <button
                onClick={() => navigate(`/sites/${id}/edit`)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 text-white"
              >
                <Pencil className="w-4 h-4" />
                แก้ไขไซต์งาน
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md md:max-w-2xl px-4">
        <h1 className="text-2xl font-extrabold mt-2">{site.site_name}</h1>

        <div className="rounded-2xl overflow-hidden mt-4 border">
          <img src={cover} alt={site.site_name} className="w-full h-48 object-cover" />
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="text-gray-700 font-semibold mb-2">ความคืบหน้าโครงการ</div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>รวม</span>
              <span>{progress.overall || 0}%</span>
            </div>
            <ProgressBar value={progress.overall} />
          </div>
          {progress.breakdown && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>โครงสร้าง</span>
                  <span>{progress.breakdown.structure || 0}%</span>
                </div>
                <ProgressBar value={progress.breakdown.structure} />
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ระบบไฟ</span>
                  <span>{progress.breakdown.electrical || 0}%</span>
                </div>
                <ProgressBar value={progress.breakdown.electrical} />
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ระบบน้ำ</span>
                  <span>{progress.breakdown.plumbing || 0}%</span>
                </div>
                <ProgressBar value={progress.breakdown.plumbing} />
              </div>
            </div>
          )}
        </div>

        {/* ✅ ส่วนการเงิน (งบประมาณ + สรุปค่าใช้จ่าย) */}
        {(role === "CEO" || role === "admin" || role === "Secretary") && (
          <>
            {/* ✅ 1. แสดงรายละเอียดงบประมาณ (ใหม่) */}
            <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-blue-900 font-semibold mb-3">
                <Wallet className="w-5 h-5" />
                รายละเอียดงบประมาณ
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">งบประมาณตั้งต้น</span>
                  <span className="font-bold text-gray-900">{formatMoney(totalBudget)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">ใช้ไปแล้วจริง</span>
                  <span className="font-bold text-red-600">-{formatMoney(totalUsed)}</span>
                </div>
                
                <div className="border-t border-blue-200 my-2"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">คงเหลือ</span>
                  <span className={`font-bold text-lg ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
                    {formatMoney(remainingBudget)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. สรุปค่าใช้จ่ายตามหมวดหมู่ (เดิม) */}
            {expenseSummary.length > 0 && (
              <div className="mt-6">
                <div className="text-gray-700 font-semibold mb-3">สรุปค่าใช้จ่ายตามหมวดหมู่</div>
                <div className="grid gap-3">
                  {expenseSummary.map((sum) => (
                    <MoneyBox
                      key={sum.expense_type}
                      label={TYPE_LABEL[sum.expense_type] || sum.expense_type}
                      amount={Number(sum.total_amount)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. ค่าใช้จ่ายล่าสุด (เดิม) */}
            <div className="mt-6">
              <div className="text-gray-700 font-semibold mb-3">ค่าใช้จ่ายล่าสุด</div>
              <div className="grid gap-3">
                {latestExpenses.length === 0 && (
                  <div className="text-gray-500">ยังไม่มีรายการค่าใช้จ่าย</div>
                )}
                {latestExpenses.slice(0, 2).map((e) => (
                  <MoneyBox
                    key={e.expense_id}
                    label={TYPE_LABEL[e.expense_type] || e.expense_type}
                    amount={Number(e.amount)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            className="rounded-2xl shadow p-4 text-center bg-white border hover:bg-gray-50"
            onClick={() => navigate(`/sites/${id}/expenses`)}
          >
            <div className="text-3xl">💳</div>
            <div className="mt-1 font-semibold">ดูค่าใช้จ่าย</div>
          </button>
          <button
            className="rounded-2xl shadow p-4 text-center bg-white border hover:bg-gray-50"
            onClick={() => navigate(`/sites/${id}/workers`)}
          >
            <div className="text-3xl">👷</div>
            <div className="mt-1 font-semibold">พนักงาน</div>
          </button>
        </div>
      </div>


{(role === "CEO" || role === "admin" || role === "Foreman") && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
    <button
      onClick={() => navigate(`/sites/${id}/progress/edit`)}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap border border-white/20"
    >
      <Pencil className="w-4 h-4" />
      <span className="font-bold text-sm">อัปเดทความคืบหน้าไซต์งาน</span>
    </button>
  </div>
)}

      <BottomNav active="home" />
    </div>
  );
}