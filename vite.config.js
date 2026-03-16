import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",   // ✅ เปิดให้เครื่องอื่นใน LAN หรือ Simulator เข้ามาได้
    port: 5173,
    strictPort: true,  // ป้องกันการเปลี่ยน Port ไปเรื่อยๆ เวลาติด Conflict
    headers: {
      // ✅ บังคับให้ Browser รับรู้ว่าเป็น UTF-8 เพื่อแก้ปัญหาตัวอักษร ?
      "Content-Type": "text/html; charset=utf-8",
    },
    watch: {
      usePolling: true, // จำเป็นสำหรับ Docker บน Windows/Hackintosh เพื่อให้ Hot Reload ทำงาน
    }
  },
  // ปรับการตั้งค่า Build เผื่อไว้สำหรับการ Render ภาษาไทยที่ถูกต้อง
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
});