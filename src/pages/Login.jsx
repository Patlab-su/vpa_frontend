// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import axios from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, Loader2, Building2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ 1. โหลด Username ที่เคยจำไว้ตอนเปิดหน้าเว็บ
  useEffect(() => {
    const savedUsername = localStorage.getItem("remember_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ ป้องกันหน้าเว็บ Refresh แต่ยังดัก event submit ได้ (ทำให้กด Enter ได้)
    
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/login", {
        username,
        password,
      });

      const { token, user } = res.data || {};

      // ✅ 2. จัดการเรื่องจำรหัสผ่าน (เก็บแค่ Username เพื่อความปลอดภัย)
      if (remember) {
        localStorage.setItem("remember_username", username);
      } else {
        localStorage.removeItem("remember_username");
      }

      // Login เข้าระบบ
      login(user, token);
      navigate("/dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* 🎨 Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Overlay Effect */}
        <div className="absolute inset-0 bg-blue-900/90 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop" 
          alt="Construction" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
        />
        
        <div className="relative z-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
               <Building2 className="w-8 h-8 text-blue-900" />
            </div>
            <span className="text-2xl font-bold tracking-wider">Construction Site</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Professional Engineering <br/> & Supply Management
          </h1>
          <p className="text-blue-200 max-w-md text-lg">
            ระบบบริหารจัดการโครงการก่อสร้าง คลังสินค้า และงานรับเหมาครบวงจร
          </p>
        </div>

        <div className="relative z-20 text-sm text-blue-300">
          © 2025 ENGINEERING AND SUPPLY CO., LTD.
        </div>
      </div>

      {/* 📝 Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              ยินดีต้อนรับกลับมา
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
            </p>
          </div>

          {/* ✅ ใช้ <form> เพื่อให้กด Enter แล้ว Submit ได้ */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสพนักงาน / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 hover:bg-white"
                    placeholder="กรอกไอดีของคุณ"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน / Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 hover:bg-white"
                    placeholder="••••••••"
                  />
                  {/* Toggle Password Visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                  จดจำรหัสผ่าน
                </label>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-pulse">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              หากพบปัญหาการใช้งาน กรุณาติดต่อฝ่าย IT Support 0986677032
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}