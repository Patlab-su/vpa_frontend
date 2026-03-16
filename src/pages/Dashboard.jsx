import React, { useState, useEffect } from "react";
import axios from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  User as UserIcon,
  ChevronRight,
  MapPin,
  LogOut,
  Plus,
  History, // ✅ 1. เพิ่ม Icon ประวัติ
  Building2 // เพิ่ม Icon สำหรับกรณีไม่มีงาน
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const API = import.meta.env.VITE_API_BASE;
axios.defaults.withCredentials = true;

const resolveSiteImage = (image_url) => {
  if (!image_url) return "https://picsum.photos/800/400?blur=2";
  const url = String(image_url);
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API}${url}`;
  return `${API}/uploads/sites/${url}`;
};

const Dashboard = () => {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/dashboard`);
        setData(res.data);
      } catch (err) {
        console.error("Fetch dashboard error", err);
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          handleLogout();
        }
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/login", { replace: true });
  };

  if (!data) return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  const role = data.user?.role;

  // ✅ 2. กรองเฉพาะงานที่ "กำลังดำเนินการ" หรือ "วางแผน"
  // (ซ่อน Completed, Cancelled, On Hold, Deleted ออกจากหน้านี้)
  const activeSites = data.sites?.filter(site => 
    ["Planning", "In Progress"].includes(site.status)
  ) || [];

  return (
    <div className="min-h-screen bg-white pb-40 font-sans">
      {/* --- Header --- */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-5 py-4 flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-full">
            <UserIcon className="w-5 h-5 text-gray-700" />
          </div>
          <div className="flex-1">
             <p className="text-xs text-gray-400">ยินดีต้อนรับ</p>
             <p className="text-sm font-bold text-gray-800 truncate">
               คุณ {data.user?.display_name || data.user?.first_name}
             </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
            title="ออกจากระบบ"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="mx-auto max-w-screen-sm px-5 pt-6">
        
        {/* ✅ 3. Section Title + History Button */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">งานปัจจุบัน</h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-bold">
              {activeSites.length}
            </span>
          </div>

          {/* ปุ่มไปหน้าประวัติ */}
          <button
            onClick={() => navigate("/sites/history")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 hover:text-blue-600 transition shadow-sm"
          >
            <History className="w-3.5 h-3.5" />
            ประวัติโครงการ
          </button>
        </div>

        {/* Site Cards List (Show only Active Sites) */}
        <div className="space-y-6">
          {activeSites.length > 0 ? (
            activeSites.map((site) => (
              <div
                key={site.site_id}
                onClick={() => navigate(`/sites/${site.site_id}`)}
                className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
              >
                {/* Image Cover */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <img
                    src={resolveSiteImage(site.image_url)}
                    alt={site.site_name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                    <span className={site.status === "In Progress" ? "text-green-600" : "text-blue-600"}>
                      {site.status === "In Progress" ? "กำลังดำเนินการ" : site.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    {site.site_name}
                  </h3>
                  {site.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {site.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-700 text-sm font-semibold group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      ดูรายละเอียด
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {site.map_link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(site.map_link, "_blank");
                        }}
                        className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                        title="เปิดแผนที่"
                      >
                        <MapPin className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // กรณีไม่มีงานปัจจุบันเลย
            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">ไม่มีไซต์งานที่กำลังดำเนินการ</p>
              <button 
                onClick={() => navigate("/sites/history")}
                className="mt-2 text-sm text-blue-600 font-bold underline"
              >
                ดูประวัติงานเก่า
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Button (Admin/CEO) */}
      {["admin", "CEO"].includes(role) && (
        <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <button
            onClick={() => navigate("/sites/add")}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold text-sm">เพิ่มไซต์งาน</span>
          </button>
        </div>
      )}

      <BottomNav role={role} active="home" />
    </div>
  );
};

export default Dashboard;