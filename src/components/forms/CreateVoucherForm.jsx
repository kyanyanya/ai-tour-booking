// src/components/forms/CreateVoucherForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/components/forms/CreateVoucherForm.css";

const CreateVoucherForm = ({ voucher, partnerId, onClose, onSuccess }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");

  const [formData, setFormData] = useState({
    code: "",
    discount_amount: "",
    tour_id: "", // "" = tất cả tour
    start_date: "", // sẽ set mặc định là now khi tạo mới
    expires_at: "",
    max_uses: "",
  });

  const [tours, setTours] = useState([]); // Danh sách tour của partner
  const [loadingTours, setLoadingTours] = useState(true);
  const [loading, setLoading] = useState(false);

  // Load danh sách tour của partner để chọn
  useEffect(() => {
    const fetchTours = async () => {
      if (!partnerId || !accessToken) return;
      try {
        const { data } = await axios.get(
          `${supabaseUrl}/rest/v1/tours?partner_id=eq.${partnerId}&select=id,name,tour_code,status`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        // Chỉ lấy tour APPROVED để tránh chọn tour chưa duyệt
        const approvedTours = data.filter((t) => t.status === "APPROVED");
        setTours(approvedTours || []);
      } catch (err) {
        console.error("Lỗi tải danh sách tour:", err);
        toast.error("Không thể tải danh sách tour để chọn.");
      } finally {
        setLoadingTours(false);
      }
    };

    fetchTours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, accessToken]);

  // Load dữ liệu voucher khi chỉnh sửa
  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code || "",
        discount_amount: voucher.discount_amount || "",
        tour_id: voucher.tour_id || "",
        start_date: voucher.start_date ? voucher.start_date.slice(0, 16) : "",
        expires_at: voucher.expires_at ? voucher.expires_at.slice(0, 16) : "",
        max_uses: voucher.max_uses || "",
      });
    } else {
      // Khi tạo mới: mặc định start_date = now
      const now = new Date().toISOString().slice(0, 16);
      setFormData((prev) => ({ ...prev, start_date: now }));
    }
  }, [voucher]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Vui lòng nhập mã voucher!");
      return;
    }
    if (!formData.discount_amount || formData.discount_amount <= 0) {
      toast.error("Vui lòng nhập số tiền giảm hợp lệ!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_amount: parseFloat(formData.discount_amount),
        owner_id: partnerId,
        tour_id: formData.tour_id || null,
        start_date: formData.start_date || null,
        expires_at: formData.expires_at || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      };

      if (voucher) {
        // Cập nhật
        await axios.patch(
          `${supabaseUrl}/rest/v1/vouchers?id=eq.${voucher.id}`,
          payload,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Cập nhật voucher thành công!");
      } else {
        // Tạo mới
        await axios.post(`${supabaseUrl}/rest/v1/vouchers`, payload, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Tạo voucher thành công!");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi lưu voucher:", err);
      if (err.response?.data?.message?.includes("unique")) {
        toast.error("Mã voucher đã tồn tại! Vui lòng chọn mã khác.");
      } else {
        toast.error(err.response?.data?.message || "Không thể lưu voucher!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-voucher-form">
      <h2>{voucher ? "Chỉnh sửa Voucher" : "Tạo Voucher Mới"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Mã voucher (VD: SAPA2025, WELCOME100)"
          required
          disabled={loading}
        />

        <input
          type="number"
          name="discount_amount"
          value={formData.discount_amount}
          onChange={handleChange}
          placeholder="Số tiền giảm (VND)"
          min="1000"
          required
          disabled={loading}
        />

        {/* Chọn tour áp dụng */}
        <label
          style={{ display: "block", margin: "16px 0 8px", fontWeight: "600" }}
        >
          Áp dụng cho tour:
        </label>
        <select
          name="tour_id"
          value={formData.tour_id}
          onChange={handleChange}
          disabled={loading || loadingTours}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1.8px solid #e0e0e0",
            fontSize: "0.95rem",
            background: "#fdfdff",
          }}
        >
          <option value="">Tất cả tour (mặc định)</option>
          {loadingTours ? (
            <option>Đang tải tour...</option>
          ) : tours.length === 0 ? (
            <option>Chưa có tour nào được duyệt</option>
          ) : (
            tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.tour_code ? `[${tour.tour_code}] ` : ""}
                {tour.name}
              </option>
            ))
          )}
        </select>

        {/* Ngày bắt đầu */}
        <label
          style={{ display: "block", margin: "16px 0 8px", fontWeight: "600" }}
        >
          Ngày bắt đầu (mặc định: ngay lập tức):
        </label>
        <input
          type="datetime-local"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          disabled={loading}
        />

        {/* Ngày kết thúc */}
        <label
          style={{ display: "block", margin: "16px 0 8px", fontWeight: "600" }}
        >
          Ngày kết thúc (để trống = không giới hạn):
        </label>
        <input
          type="datetime-local"
          name="expires_at"
          value={formData.expires_at}
          onChange={handleChange}
          disabled={loading}
        />

        {/* Số lượng sử dụng */}
        <label
          style={{ display: "block", margin: "16px 0 8px", fontWeight: "600" }}
        >
          Số lượng sử dụng tối đa (để trống = không giới hạn):
        </label>
        <input
          type="number"
          name="max_uses"
          value={formData.max_uses}
          onChange={handleChange}
          placeholder="VD: 50"
          min="1"
          disabled={loading}
        />

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Đang lưu..."
              : voucher
              ? "Cập nhật Voucher"
              : "Tạo Voucher"}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVoucherForm;
