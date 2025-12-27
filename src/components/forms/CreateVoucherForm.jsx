// src/components/forms/CreateVoucherForm.jsx
import React, { useState, useEffect, useRef } from "react";
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
    tour_id: "",
    start_date: "",
    expires_at: "",
    total_issued: "",
    point_cost: "0",
  });

  const [tours, setTours] = useState([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loading, setLoading] = useState(false);

  const submitLock = useRef(false);

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

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code || "",
        discount_amount: voucher.discount_amount || "",
        tour_id: voucher.tour_id || "",
        start_date: voucher.start_date ? voucher.start_date.slice(0, 16) : "",
        expires_at: voucher.expires_at ? voucher.expires_at.slice(0, 16) : "",
        total_issued: voucher.total_issued || "",
        point_cost: voucher.point_cost ?? "0",
      });
    } else {
      const now = new Date().toISOString().slice(0, 16);
      setFormData((prev) => ({ ...prev, start_date: now, point_cost: "0" }));
    }
  }, [voucher]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;

    if (!formData.code.trim()) {
      toast.error("Vui lòng nhập mã voucher!");
      submitLock.current = false;
      return;
    }
    if (!formData.discount_amount || formData.discount_amount <= 0) {
      toast.error("Vui lòng nhập số tiền giảm hợp lệ!");
      submitLock.current = false;
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
        total_issued: formData.total_issued
          ? parseInt(formData.total_issued)
          : null,
        point_cost: parseInt(formData.point_cost) || 0,
        claimed_count: voucher?.claimed_count || 0,
        claimed_by: voucher?.claimed_by || [],
      };

      if (voucher) {
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
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-voucher-form">
      <h2>{voucher ? "Chỉnh sửa Voucher" : "Tạo Voucher Mới"}</h2>

      <div className="form-scroll-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Mã voucher *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="VD: SAPA2025"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Số tiền giảm (VND) *</label>
            <input
              type="number"
              name="discount_amount"
              value={formData.discount_amount}
              onChange={handleChange}
              placeholder="VD: 200000"
              min="1000"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Điểm cần để mua (0 = miễn phí)</label>
            <input
              type="number"
              name="point_cost"
              value={formData.point_cost}
              onChange={handleChange}
              placeholder="VD: 500 (để 0 nếu miễn phí)"
              min="0"
              disabled={loading}
            />
            <small> Nếu = 0 thì người dùng có thể nhận miễn phí.</small>
          </div>

          <div className="form-group">
            <label>Áp dụng cho tour</label>
            <select
              name="tour_id"
              value={formData.tour_id}
              onChange={handleChange}
              disabled={loading || loadingTours}
            >
              <option value="">Tất cả tour</option>
              {loadingTours ? (
                <option>Đang tải...</option>
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
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Ngày bắt đầu</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                disabled={loading}
              />
              <small>Mặc định: ngay lập tức</small>
            </div>

            <div className="form-group half">
              <label>Ngày kết thúc</label>
              <input
                type="datetime-local"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                disabled={loading}
              />
              <small>Để trống = không giới hạn</small>
            </div>
          </div>

          <div className="form-group">
            <label>Số lượng phát ra</label>
            <input
              type="number"
              name="total_issued"
              value={formData.total_issued}
              onChange={handleChange}
              placeholder="VD: 50 (để trống = không giới hạn)"
              min="1"
              disabled={loading}
            />
            <small>Mỗi khách chỉ nhận/mua được 1 lần duy nhất</small>
          </div>
        </form>
      </div>

      {/* Nút hành động cố định ở dưới */}
      <div className="form-actions-fixed">
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Đang lưu..." : voucher ? "Cập nhật" : "Tạo Voucher"}
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
    </div>
  );
};

export default CreateVoucherForm;
