// src/pages/SiteHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "../services/api";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Calendar, MapPin, Building2, AlertCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";

const API = import.meta.env.VITE_API_BASE;

// ฟังก์ชันแปลงรูป (ใช้เหมือนหน้า Dashboard)
const resolveSiteImage = (image_url) => {
  if (!image_url) return "https://picsum.photos/800/400?blur=2";
  const url = String(image_url);
  if (/^https?:\/\//i.test(url)) return url;
  return `${API}${url.startsWith("/uploads") ? "" : "/uploads/sites/"}${url}`;
};

const SiteHistory = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Completed, Cancelled

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/sites/history");
        setSites(res.data.data || []);
      } catch (err) {
        console.error("Fetch history error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Logic กรองข้อมูล
  const filteredSites = sites.filter((site) => {
    const matchSearch = site.site_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "All" || site.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-screen-sm px-4 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">ประวัติไซต์งาน</h1>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="px-4 pb-4 max-w-screen-sm mx-auto">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="ค้นหาชื่อไซต์งาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-gray-200 outline-none"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["All", "Completed", "Cancelled", "On Hold"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  filterStatus === status 
                    ? "bg-gray-800 text-white border-gray-800" 
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status === "All" ? "ทั้งหมด" : status === "Completed" ? "เสร็จสิ้น" : status === "Cancelled" ? "ยกเลิก" : "ระหว่างดำเนินการ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-sm mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : filteredSites.length > 0 ? (
          filteredSites.map((site) => (
            <div 
              key={site.site_id}
              onClick={() => navigate(`/sites/${site.site_id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="flex">
                {/* รูปภาพด้านซ้าย */}
                <div className="w-1/3 min-w-[100px] bg-gray-200 relative">
                  <img 
                    src={resolveSiteImage(site.image_url)} 
                    alt={site.site_name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 grayscale" // ใส่ grayscale ให้รู้ว่าเป็นงานเก่า
                  />
                </div>
                
                {/* ข้อมูลด้านขวา */}
                <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${
                            site.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            site.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            {site.status === 'Completed' ? 'เสร็จสิ้น' : site.status === 'Cancelled' ? 'ยกเลิก' : site.status}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{site.site_name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{site.description || "ไม่มีรายละเอียด"}</p>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">แผนที่</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(site.updated_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit'})}</span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 opacity-60">
            <Building2 className="w-16 h-16 mb-2" />
            <p>ไม่พบประวัติไซต์งาน</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default SiteHistory;