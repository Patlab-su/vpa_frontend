// src/pages/Audit.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav"; // ✅ 1. Import BottomNav ตาม Dashboard
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

axios.defaults.withCredentials = true;
const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// helper: mapping action -> badge style
const ACTION_STYLES = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-blue-100 text-blue-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  UPLOAD: "bg-purple-100 text-purple-700",
  FEEDBACK: "bg-violet-100 text-violet-700",
};

/**
 * prettySubjectSync(subject)
 */
function prettySubjectSync(subject) {
  if (!subject) return "";

  const s = subject.toString();

  // 1. Site Management
  if (/POST\s+\/api\/sites(\?.*)?$/.test(s)) return "เพิ่มรายละเอียดไซต์งานใหม่";
  if (/PUT\s+\/api\/sites\/\d+/.test(s)) {
    const m = s.match(/\/api\/sites\/(\d+)/);
    return `แก้ไขรายละเอียดไซต์งาน (id=${m ? m[1] : 'unknown'})`;
  }
  if (/DELETE\s+\/api\/sites\/\d+/.test(s)) {
    const m = s.match(/\/api\/sites\/(\d+)/);
    return `ลบไซต์งานออกจากระบบ (id=${m ? m[1] : 'unknown'})`;
  }
  if (/POST\s+\/api\/sites\/\d+\/images/.test(s)) {
    const m = s.match(/\/api\/sites\/(\d+)/);
    return `อัปโหลดรูปภาพไซต์งาน (id=${m ? m[1] : 'unknown'})`;
  }
  
  // 2. Worker/Employee Management
  if (/POST\s+\/api\/workers/.test(s)) return "เพิ่มรายชื่อพนักงานใหม่";
  if (/PUT\s+\/api\/workers\/\d+/.test(s)) {
    const m = s.match(/\/api\/workers\/(\d+)/);
    return `อัปเดทรายละเอียดพนักงาน (id=${m ? m[1] : 'unknown'})`;
  }
  if (/DELETE\s+\/api\/workers\/\d+/.test(s)) {
    const m = s.match(/\/api\/workers\/(\d+)/);
    return `ลบพนักงานออกจากระบบ (id=${m ? m[1] : 'unknown'})`;
  }
  
  // 3. Expense Management
  if (/POST\s+\/api\/expenses/.test(s)) return "ส่งข้อมูลบิล/ค่าใช้จ่ายเข้าระบบ";
  if (/PUT\s+\/api\/expenses\/\d+\/approve/.test(s)) {
    const m = s.match(/\/api\/expenses\/(\d+)/);
    return `อนุมัติรายการค่าใช้จ่าย (บิล) (id=${m ? m[1] : 'unknown'})`;
  }
  if (/PUT\s+\/api\/expenses\/\d+\/reject/.test(s)) {
    const m = s.match(/\/api\/expenses\/(\d+)/);
    return `ปฏิเสธรายการค่าใช้จ่าย (บิล) (id=${m ? m[1] : 'unknown'})`;
  }
  
  // 4. เส้นทางเดิม
  if (/GET\s+\/api\/sites\/\d+\/progress/.test(s)) return "เรียกหน้าแสดงความคืบหน้าไซต์งาน";
  if (/GET\s+\/api\/sites\/\d+/.test(s)) {
    const m = s.match(/\/api\/sites\/(\d+)/);
    if (m) return `เรียกหน้าไซต์งาน (id=${m[1]})`;
    return "เรียกหน้าไซต์งาน";
  }
  if (/GET\s+\/api\/expenses\/summary/.test(s)) return "เรียกหน้าค่าใช้จ่ายรวม";
  if (/GET\s+\/api\/expenses(\?.*)?$/.test(s)) {
    return "เรียกหน้าข้อมูลค่าใช้จ่าย";
  }
  if (/GET\s+\/api\/workers/.test(s)) return "เรียกหน้าแสดงพนักงาน";
  if (/POST\s+\/api\/users/.test(s)) return "เพิ่มผู้ใช้งานใหม่";
  if (/PUT\s+\/api\/users\/\d+/.test(s)) return "แก้ไขข้อมูลผู้ใช้งาน";
  if (/DELETE\s+\/api\/users\/\d+/.test(s)) return "ลบผู้ใช้งาน";
  if (/PUT\s+\/api\/expenses\/\d+/.test(s)) return "แก้ไขรายการค่าใช้จ่าย";
  if (/DELETE\s+\/api\/expenses\/\d+/.test(s)) return "ลบรายการค่าใช้จ่าย";

  return subject;
}

export default function Audit() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters state
  const [q, setQ] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [selectedActions, setSelectedActions] = useState([]); 
  const [browser, setBrowser] = useState(""); 
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const actionsList = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "UPLOAD", "FEEDBACK"];

  const actionDropdownRef = useRef();
  const userDropdownRef = useRef();

  // fetch users
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users?limit=100`);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("fetch users error", err);
    }
  };

  // fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (q) params.search = q;
      if (selectedActions.length) params.action = selectedActions.join(",");
      if (selectedUsers.length) params.user = selectedUsers.join(",");
      if (browser) params.browser = browser;

      const res = await axios.get(`${API}/api/audit`, { params });
      const data = res.data;
      setLogs(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      console.error("fetch audit logs error", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        if (typeof logout === "function") logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, selectedActions, selectedUsers, browser, page]);

  // helpers for toggles
  const toggleAction = (act) =>
    setSelectedActions((prev) => (prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]));

  const toggleUser = (id) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));

  const clearFilters = () => {
    setQ("");
    setSelectedActions([]);
    setSelectedUsers([]);
    setBrowser("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-screen-sm px-4 py-4 flex items-center gap-3">
          <UserIcon className="w-6 h-6 text-black" />
          <h1 className="text-lg font-semibold">บันทึกการตรวจสอบ</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                clearFilters();
                setPage(1);
              }}
              className="text-sm px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
              title="ล้างฟิลเตอร์"
            >
              ล้าง
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto max-w-screen-sm px-4 py-4 space-y-3">
        <div className="flex gap-3 items-center">
          {/* User filter */}
          <div className="relative" ref={userDropdownRef}>
            <button
              className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white"
              onClick={() => {
                const el = userDropdownRef.current?.querySelector(".dropdown");
                if (el) el.classList.toggle("hidden");
              }}
            >
              User <ChevronDown className="w-4 h-4" />
            </button>
            <div className="dropdown hidden absolute mt-2 left-0 w-[260px] bg-white border rounded-xl shadow-lg p-3 z-20">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers(users.map((u) => u.user_id));
                    else setSelectedUsers([]);
                  }}
                />
                <span className="text-sm">เลือกทั้งหมด</span>
              </label>
              <div className="max-h-44 overflow-auto">
                {users.map((u) => (
                  <label key={u.user_id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.user_id)}
                      onChange={() => toggleUser(u.user_id)}
                    />
                    <span className="text-sm">{u.display_name || u.username}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action filter */}
          <div className="relative" ref={actionDropdownRef}>
            <button
              className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white"
              onClick={() => {
                const el = actionDropdownRef.current?.querySelector(".dropdown");
                if (el) el.classList.toggle("hidden");
              }}
            >
              Action <ChevronDown className="w-4 h-4" />
            </button>
            <div className="dropdown hidden absolute mt-2 left-0 w-52 bg-white border rounded-xl shadow-lg p-3 z-20">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedActions.length === actionsList.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedActions([...actionsList]);
                    else setSelectedActions([]);
                  }}
                />
                <span className="text-sm">เลือกทั้งหมด</span>
              </label>
              <div className="space-y-2">
                {actionsList.map((a) => (
                  <label key={a} className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedActions.includes(a)} onChange={() => toggleAction(a)} />
                    <span className={`text-xs px-2 py-1 rounded-full ${ACTION_STYLES[a] || "bg-gray-100 text-gray-700"}`}>
                      {a}
                    </span>
                    <span className="text-sm ml-2">{a}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Browser filter */}
          <div>
            <select
              className="px-3 py-2 border rounded-lg bg-white"
              value={browser}
              onChange={(e) => {
                setBrowser(e.target.value);
                setPage(1);
              }}
            >
              <option value="">เบราว์เซอร์</option>
              <option value="chrome">Chrome</option>
              <option value="safari">Safari</option>
              <option value="edge">Edge</option>
              <option value="mobile">มือถือ</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหา (action, subject, username)"
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mx-auto max-w-screen-sm px-4">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="py-3 pr-3">ผู้ใช้</th>
                <th className="py-3 pr-3">การดำเนินการ</th>
                <th className="py-3 pr-3">วันที่และเวลา</th>
                <th className="py-3 pr-3">หัวข้อ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="py-6 text-center">กำลังโหลด...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="py-6 text-center text-gray-500">ไม่มีบันทึก</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="border-t">
                    <td className="py-4 align-top">
                      <div className="text-sm font-semibold">{log.display_name || log.username}</div>
                      <div className="text-xs text-gray-400">{log.username}</div>
                    </td>
                    <td className="py-4 align-top">
                      <span className={`inline-flex items-center text-xs rounded-full px-2 py-1 ${ACTION_STYLES[log.action] || "bg-gray-100 text-gray-700"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 align-top text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 align-top text-sm text-gray-800">
                      {prettySubjectSync(log.subject) || log.detail || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mx-auto max-w-screen-sm px-4 mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-2 border rounded-lg disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spacing for Navbar */}
      <div className="h-20" />

      {/* ✅ 2. ใส่ BottomNav ไว้ล่างสุด */}
      <BottomNav />
    </div>
  );
}