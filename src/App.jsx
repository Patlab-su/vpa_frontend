// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SiteDetail from "./pages/SiteDetail";
import ExpensesReport from "./pages/ExpensesReport";
import WorkersBySite from "./pages/WorkersBySite";
import AllWorkers from "./pages/AllWorkers";
import WorkerDetail from "./pages/WorkerDetail";
import WorkerFormAdd from "./pages/WorkerFormAdd";
import WorkerFormEdit from "./pages/WorkerFormEdit";
import SiteAdd from "./pages/SiteAdd";
import SiteEdit from "./pages/SiteEdit";
import SiteProgressEdit from "./pages/SiteProgressEdit";
import SiteHistory from "./pages/SiteHistory";
// ✅ หน้าใหม่
import ExpenseSummary from "./pages/ExpenseSummary";
import ExpenseFormAdd from "./pages/ExpenseFormAdd"; // <--- ฟอร์มเพิ่มบิล
import Profile from "./pages/Profile"; // ✅ โปรไฟล์
import PendingExpenses from "./pages/PendingExpenses";
import ExpenseDetail from "./pages/ExpenseDetail.jsx";
import MyExpenseHistory from "./pages/MyExpenseHistory";
// ✅ Admin manage users
import UserManage from "./pages/UserManage";
import UserFormEdit from "./pages/UserFormEdit"; // ✅ เพิ่มไฟล์แก้ไขผู้ใช้
import UserFormAdd from "./pages/UserFormAdd";

// Audit page
import Audit from "./pages/Audit";

// ✅ นำเข้าหน้ารายรับ (Incomes) ที่เพิ่มเข้ามาใหม่
import IncomeSummary from "./pages/IncomeSummary";
import IncomeFormAdd from "./pages/IncomeFormAdd"; // ไฟล์ฟอร์มบันทึกรายรับ
import IncomeHistory from "./pages/IncomeHistory"; // ไฟล์ดูประวัติรายรับ

/**
 * RoleRoute - wrapper component to protect routes by allowed roles
 * Usage: <RoleRoute allowedRoles={['admin','audit']}><Audit /></RoleRoute>
 */
function RoleRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return null; // หรือ spinner ขณะเช็ก token

  if (!user) {
    // ถ้ายังไม่ล็อกอิน -> ไปหน้า login
    return <Navigate to="/login" replace />;
  }

  // ถ้า user.role ไม่มีใน allowedRoles -> ไป dashboard หรือหน้า 403
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sites/history" element={<SiteHistory />} />
      {/* Site detail & related */}
      <Route path="/sites/:id" element={<SiteDetail />} />
      <Route path="/sites/:id/expenses" element={<ExpensesReport />} />
      <Route path="/sites/:id/expenses/add" element={<ExpenseFormAdd />} />
      <Route path="/sites/:id/workers" element={<WorkersBySite />} />
      <Route path="/sites/add" element={<SiteAdd />} />
      <Route path="/sites/:id/edit" element={<SiteEdit />} />
      <Route path="/sites/:id/progress/edit" element={<SiteProgressEdit />} />

      {/* Workers */}
      <Route path="/workers" element={<AllWorkers />} />
      <Route path="/workers/add" element={<WorkerFormAdd />} />
      <Route path="/workers/:id" element={<WorkerDetail />} />
      <Route path="/workers/:id/edit" element={<WorkerFormEdit />} />

      {/* Expense Summary */}
      <Route path="/expenses/summary" element={<ExpenseSummary />} />
      <Route path="/expenses/pending" element={<PendingExpenses />} />
      <Route path="/expenses" element={<ExpenseDetail />} />
      <Route path="/sites/:siteId/expenses" element={<ExpenseDetail />} />
      {/* ✅ เพิ่ม Route สำหรับหน้า MyExpenseHistory ตรงนี้ครับ */}
      <Route path="/expenses/my-history" element={<MyExpenseHistory />} />

      {/* ✅ Incomes (ระบบรายรับที่เพิ่มใหม่ พร้อมจำกัดสิทธิ์) */}
      <Route 
        path="/incomes/summary" 
        element={
          <RoleRoute allowedRoles={["admin", "CEO", "Secretary"]}>
            <IncomeSummary />
          </RoleRoute>
        } 
      />
      <Route 
        path="/incomes/add" 
        element={
          <RoleRoute allowedRoles={["admin", "CEO", "Secretary"]}>
            <IncomeFormAdd />
          </RoleRoute>
        } 
      />
      <Route 
        path="/incomes/history" 
        element={
          <RoleRoute allowedRoles={["admin", "CEO", "Secretary"]}>
            <IncomeHistory />
          </RoleRoute>
        } 
      />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />

      {/* ✅ Admin Manage Users */}
      <Route path="/users/manage" element={<UserManage />} />
      <Route path="/users/:id/edit" element={<UserFormEdit />} />
      <Route path="/users/add" element={<UserFormAdd />} />

      {/* Audit: อนุญาตให้ admin และ audit เข้าได้ */}
      <Route
        path="/audit"
        element={
          <RoleRoute allowedRoles={["admin", "audit"]}>
            <Audit />
          </RoleRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;