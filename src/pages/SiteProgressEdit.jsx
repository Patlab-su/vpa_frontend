// src/pages/SiteProgressEdit.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, Image as ImageIcon } from "lucide-react";
import axios from "../services/api";

export default function SiteProgressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    overall: "",
    structure: "",
    electrical: "",
    plumbing: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  // --- 🌟 ส่วนที่เพิ่ม: ดึงข้อมูลปัจจุบันมาค้างไว้ในฟอร์ม ---
  useEffect(() => {
    async function loadCurrentProgress() {
      try {
        const res = await axios.get(`/api/sites/${id}/progress`);
        const data = res.data?.data;
        if (data) {
          setForm({
            overall: data.overall ?? "",
            structure: data.structure ?? "",
            electrical: data.electrical ?? "",
            plumbing: data.plumbing ?? "",
            image_url: data.image_url ?? "",
          });
        }
      } catch (err) {
        console.error("Error fetching current progress:", err);
      }
    }
    loadCurrentProgress();
  }, [id]);

  const numberOrEmpty = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : "";
  };

  // คำนวณ overall จาก 3 รายการ (เฉลี่ย)
  useEffect(() => {
    const s = Number(form.structure || 0);
    const e = Number(form.electrical || 0);
    const p = Number(form.plumbing || 0);
    
    // ตรวจสอบว่ามีการกรอกค่าใดค่าหนึ่งหรือไม่
    const hasAny = [form.structure, form.electrical, form.plumbing].some(
      (x) => x !== "" && x !== null && x !== undefined
    );
    
    const avg = hasAny ? Math.round((s + e + p) / 3) : "";
    setForm((prev) => ({ ...prev, overall: avg }));
  }, [form.structure, form.electrical, form.plumbing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // เก็บเฉพาะตัวเลข 0-100
    const v = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setForm({ ...form, [name]: v });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setImageFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", imageFile);
      const res = await axios.post("/api/upload/site-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) return res.data.url; 
      return null;
    } catch (err) {
      console.error("Upload error", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let uploadedUrl = form.image_url;

      if (imageFile) {
        const url = await handleImageUpload();
        if (url) uploadedUrl = url;
      }

      await axios.post(`/api/sites/${id}/progress`, {
        ...form,
        overall: numberOrEmpty(form.overall),
        structure: numberOrEmpty(form.structure),
        electrical: numberOrEmpty(form.electrical),
        plumbing: numberOrEmpty(form.plumbing),
        image_url: uploadedUrl || null,
      });

      navigate(`/sites/${id}`);
    } catch (err) {
      console.error("Update progress error", err);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top bar */}
      <div className="mx-auto max-w-md md:max-w-2xl px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
        >
          <ChevronLeft className="w-6 h-6 stroke-[3] text-blue-600" />
          <span className="text-lg font-medium text-blue-600">Back</span>
        </button>
      </div>

      <div className="mx-auto max-w-md md:max-w-2xl px-4 text-left">
        <h1 className="text-2xl font-extrabold mt-2">อัปเดทความคืบหน้า</h1>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">งานโครงสร้าง (%)</label>
              <input
                type="number"
                name="structure"
                value={form.structure}
                onChange={handleChange}
                placeholder="0 - 100"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">งานระบบไฟ (%)</label>
              <input
                type="number"
                name="electrical"
                value={form.electrical}
                onChange={handleChange}
                placeholder="0 - 100"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">งานระบบน้ำ (%)</label>
              <input
                type="number"
                name="plumbing"
                value={form.plumbing}
                onChange={handleChange}
                placeholder="0 - 100"
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">เปอร์เซ็นรวม (คำนวณอัตโนมัติ)</label>
              <input
                type="number"
                name="overall"
                value={form.overall}
                readOnly
                className="border rounded-xl p-3 w-full bg-gray-50 font-bold text-blue-600"
              />
            </div>
          </div>

          {/* Upload Section */}
          <div className="rounded-2xl border-2 border-dashed p-6 bg-gray-50/50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">อัปโหลดภาพปกล่าสุดของไซต์</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border shadow-sm cursor-pointer hover:bg-gray-50 transition">
                <Upload className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">เลือกรูปภาพ</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {uploading && <span className="text-blue-600 text-sm animate-pulse">กำลังอัปโหลด...</span>}
            </div>
            
            {(preview || form.image_url) && (
              <div className="mt-4 relative rounded-xl overflow-hidden border bg-white">
                <img
                  src={preview || (form.image_url.startsWith('http') ? form.image_url : `${import.meta.env.VITE_API_BASE}${form.image_url}`)}
                  alt="preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400"
            >
              {uploading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3 rounded-2xl border font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}