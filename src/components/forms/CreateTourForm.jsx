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

  // Hàm lấy danh sách admin ids từ VIEW (ổn định hơn RPC)
  const getAdminIds = async () => {
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/admin_ids_view`, // ← ĐÃ THAY ĐỔI CHÍNH Ở ĐÂY
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      return data || [];
    } catch (err) {
      console.error("Lỗi lấy danh sách admin từ view:", err);
      return [];
    }
  };

  // Hàm gửi thông báo đến TẤT CẢ admin (mỗi admin 1 bản riêng)
  const notifyAllAdmins = async (message, type, tourId = null) => {
    if (!session?.access_token) return;

    const admins = await getAdminIds();

    if (admins.length === 0) {
      console.warn("Không có Admin nào để gửi thông báo.");
      return;
    }

    try {
      for (const admin of admins) {
        await axios.post(
          `${supabaseUrl}/rest/v1/admin_notifications`,
          {
            to_admin_id: admin.admin_id,
            from_role: "partner",
            from_id: user.id,
            message,
            type,
            tour_id: tourId,
            status: "unread",
          },
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
      console.log(`Đã gửi thông báo "${type}" đến ${admins.length} admin.`);
    } catch (err) {
      console.error("Lỗi khi gửi thông báo đến một hoặc nhiều admin:", err);
      // Không block việc tạo tour
    }
  };

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
      const partnerName = user?.full_name?.trim() || "Partner";

      // 1. Tạo tour
      const tourResponse = await axios.post(
        `${supabaseUrl}/rest/v1/tours`,
        {
          partner_id: user.id,
          partner_name: partnerName,
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
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
        }
      );

      const newTour = tourResponse.data[0];

      // 2. Gửi thông báo đến TẤT CẢ admin (dùng view → ổn định, không lỗi 404)
      await notifyAllAdmins(
        `Partner "${partnerName}" vừa tạo tour mới và đang chờ duyệt: "${newTour.name}"`,
        "tour_created",
        newTour.id
      );

      toast.success("Tạo tour thành công! Đã gửi thông báo đến tất cả Admin.");

      // Gọi onSuccess để PartnerDashboard reload danh sách tour
      if (onSuccess) {
        onSuccess(); // Không cần truyền newTour nữa vì PartnerDashboard tự fetch lại
      }

      onClose();
    } catch (error) {
      console.error("Lỗi tạo tour:", error);
      const msg = error.response?.data?.message || "Không thể tạo tour!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-tour-form">
      <h2>Tạo Tour Mới</h2>

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
