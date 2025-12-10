// src/components/forms/CreateTourForm.jsx
import React, { useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/components/forms/CreateTourForm.css";

const CreateTourForm = ({ onClose, onSuccess }) => {
  const { user, session } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    location: "",
    duration_days: "",
  });

  const [itineraryDays, setItineraryDays] = useState([
    { day: 1, activities: "" },
  ]);

  const [loading, setLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayChange = (index, value) => {
    const updated = [...itineraryDays];
    updated[index].activities = value;
    setItineraryDays(updated);
  };

  const addDay = () => {
    setItineraryDays([
      ...itineraryDays,
      { day: itineraryDays.length + 1, activities: "" },
    ]);
  };

  const removeDay = (index) => {
    if (itineraryDays.length === 1) return;
    setItineraryDays(itineraryDays.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim() || !formData.price) {
      toast.error("Vui lòng nhập tên tour và giá!");
      setLoading(false);
      return;
    }

    if (itineraryDays.some((d) => !d.activities.trim())) {
      toast.error("Vui lòng nhập hoạt động cho tất cả các ngày!");
      setLoading(false);
      return;
    }

    try {
      // Lấy tên Partner từ user.full_name (đảm bảo luôn có)
      const partnerName = user?.full_name?.trim() || "Partner";

      const tourData = {
        partner_id: user.id,
        partner_name: partnerName, // THÊM TÊN PARTNER VÀO ĐÂY
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        location: formData.location.trim() || null,
        duration_days: formData.duration_days
          ? parseInt(formData.duration_days, 10)
          : null,
        itinerary: itineraryDays.map((d) => ({
          day: d.day,
          activities: d.activities.trim(),
        })),
        status: "PENDING_APPROVAL",
      };

      await axios.post(`${supabaseUrl}/rest/v1/tours`, tourData, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
      });

      toast.success(`Tạo tour thành công bởi ${partnerName}!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi tạo tour:", error);
      const msg =
        error.response?.data?.message ||
        "Không thể tạo tour. Vui lòng thử lại!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-tour-form">
      <h2>Tạo Tour Mới</h2>

      {/* Hiển thị tên Partner đang tạo */}
      <div
        style={{
          marginBottom: "20px",
          textAlign: "center",
          color: "#555",
          fontSize: "0.95rem",
        }}
      >
        Đang tạo tour với tài khoản:{" "}
        <strong>{user?.full_name || "Partner"}</strong>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tên tour (bắt buộc)"
          required
          disabled={loading}
        />

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả tour (khuyến khích)"
          rows={3}
          disabled={loading}
        />

        <div className="form-row">
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Giá (VND)"
            required
            min="0"
            disabled={loading}
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Địa điểm (VD: Đà Lạt)"
            disabled={loading}
          />
        </div>

        <input
          type="number"
          name="duration_days"
          value={formData.duration_days}
          onChange={handleChange}
          placeholder="Số ngày (VD: 3)"
          min="1"
          disabled={loading}
        />

        <div className="itinerary-section">
          <div className="itinerary-header">
            <h3>Lịch trình chi tiết</h3>
            <button
              type="button"
              className="btn-add-day"
              onClick={addDay}
              disabled={loading}
            >
              + Thêm ngày
            </button>
          </div>

          {itineraryDays.map((item, index) => (
            <div key={index} className="itinerary-day">
              <div className="day-label">
                <strong>Ngày {item.day}</strong>
                {itineraryDays.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-day"
                    onClick={() => removeDay(index)}
                    disabled={loading}
                  >
                    X
                  </button>
                )}
              </div>
              <textarea
                placeholder={`Hoạt động ngày ${item.day}...`}
                value={item.activities}
                onChange={(e) => handleDayChange(index, e.target.value)}
                rows={4}
                required
                disabled={loading}
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Đang tạo tour..." : "Tạo Tour"}
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

export default CreateTourForm;
