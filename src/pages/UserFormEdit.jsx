// src/pages/UserFormEdit.jsx
import React, { useEffect, useState } from "react";
import axios from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Mail, Lock, Phone, User, Tag, Shield, CheckCircle2 } from "lucide-react";
import BottomNav from "../components/BottomNav";

const API = import.meta.env.VITE_API_BASE;
axios.defaults.withCredentials = true;

// ✅ ใช้ Roles ที่ตรงกับ Database
const roles = ["admin", "CEO", "Secretary", "Foreman", "audit"];

const UserFormEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/users/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      navigate("/users/manage");
    } catch (err) {
      console.error("Failed to update user", err);
      alert("ไม่สามารถอัปเดตผู้ใช้ได้: " + (err.response?.data?.message || ""));
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-40 font-sans">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/users/manage")}
            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:bg-blue-50 px-2 py-1 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>กลับ</span>
          </button>
          <h2 className="text-xl font-bold text-gray-800">แก้ไขข้อมูลผู้ใช้</h2>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-screen-sm mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: บัญชีผู้ใช้ */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> ข้อมูลบัญชี
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Username</label>
              <input 
                name="username" 
                value={form.username || ""} 
                onChange={handleChange} 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-gray-500 cursor-not-allowed" 
                readOnly 
              />
              <p className="text-[10px] text-gray-400 ml-1">* ชื่อผู้ใช้ไม่สามารถแก้ไขได้</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
              <input 
                type="email" 
                name="email" 
                value={form.email || ""} 
                onChange={handleChange} 
                required 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-100 outline-none font-semibold" 
              />
            </div>
          </div>

          {/* Section: ข้อมูลส่วนตัว */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> ข้อมูลส่วนตัวและสิทธิ์
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">ชื่อที่แสดง (Display Name)</label>
              <input name="display_name" value={form.display_name || ""} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-100 outline-none font-semibold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">ชื่อจริง</label>
                <input name="first_name" value={form.first_name || ""} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-100 outline-none font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">นามสกุล</label>
                <input name="last_name" value={form.last_name || ""} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-100 outline-none font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">ชื่อเล่น</label>
                <input name="nickname" value={form.nickname || ""} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-100 outline-none font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">เบอร์โทรศัพท์</label>
                <input name="phone" value={form.phone || ""} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-100 outline-none font-semibold" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-500" /> บทบาทผู้ใช้งาน
              </label>
              <select 
                name="role" 
                value={form.role || "Foreman"} 
                onChange={handleChange} 
                className="w-full bg-purple-50 border-none rounded-2xl px-5 py-3.5 font-bold text-purple-600 outline-none appearance-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between px-2 pt-2">
              <label className="text-sm font-bold text-gray-600">สถานะบัญชี</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active || false} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-bold text-green-600 uppercase">{form.is_active ? "ปกติ" : "ไม่ใช้งาน"}</span>
              </label>
            </div>
          </div>

          
<div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
  <button
    type="submit"
    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap border border-white/20"
  >
    <Save className="w-4 h-4" />
    <span className="font-bold text-sm">บันทึกการแก้ไขข้อมูล</span>
  </button>
</div>
        </form>
      </div>

      <BottomNav active="users" />
    </div>
  );
};

export default UserFormEdit;