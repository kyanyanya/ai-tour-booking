// src/components/forms/CreateTourForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/components/forms/CreateTourForm.css";

const CreateTourForm = ({ onClose, onSuccess, tour }) => {
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

  // Điền dữ liệu khi đang sửa tour
  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name || "",
        description: tour.description || "",
        price: tour.price || "",
        location: tour.location || "",
        duration_days: tour.duration_days || "",
      });

      // Nếu có lịch trình (itinerary)
      if (
        tour.itinerary &&
        Array.isArray(tour.itinerary) &&
        tour.itinerary.length > 0
      ) {
        setItineraryDays(
          tour.itinerary.map((item, index) => ({
            day: index + 1,
            activities: item.activities || "",
          }))
        );
      } else {
        setItineraryDays([{ day: 1, activities: "" }]);
      }
    }
  }, [tour]);

  // Lấy danh sách admin từ view
  const getAdminIds = async () => {
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/admin_ids_view`,
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

  // Gửi thông báo đến tất cả Admin
  const notifyAllAdmins = async (message, type, tourId = null) => {
    if (!session?.access_token) return;

    const admins = await getAdminIds();
    if (admins.length === 0) return;

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
    } catch (err) {
      console.error("Lỗi gửi thông báo đến Admin:", err);
      // Không block lưu tour
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

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên tour!");
      setLoading(false);
      return;
    }

    if (!formData.price || isNaN(formData.price)) {
      toast.error("Vui lòng nhập giá hợp lệ!");
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
      const tourName = formData.name.trim();

      if (tour) {
        // === CHỈNH SỬA TOUR ===
        await axios.patch(
          `${supabaseUrl}/rest/v1/tours?id=eq.${tour.id}`,
          {
            name: tourName,
            description: formData.description.trim() || null,
            price: parseFloat(formData.price),
            location: formData.location.trim() || null,
            duration_days: formData.duration_days
              ? parseInt(formData.duration_days, 10)
              : null,
            itinerary: itineraryDays.map((d, idx) => ({
              day: idx + 1,
              activities: d.activities.trim(),
            })),
            status: "PENDING_APPROVAL", // Luôn phải chờ duyệt lại sau khi sửa
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

        // Gửi thông báo cập nhật cho Admin
        await notifyAllAdmins(
          `Partner "${partnerName}" đã cập nhật tour "${tourName}" và đang chờ duyệt lại.`,
          "tour_updated", // Bạn có thể thêm type này vào admin_notifications nếu muốn phân biệt
          tour.id
        );

        toast.success(
          "Cập nhật tour thành công! Đã gửi yêu cầu duyệt lại đến Admin."
        );
      } else {
        // === TẠO TOUR MỚI ===
        const tourResponse = await axios.post(
          `${supabaseUrl}/rest/v1/tours`,
          {
            partner_id: user.id,
            partner_name: partnerName,
            name: tourName,
            description: formData.description.trim() || null,
            price: parseFloat(formData.price),
            location: formData.location.trim() || null,
            duration_days: formData.duration_days
              ? parseInt(formData.duration_days, 10)
              : null,
            itinerary: itineraryDays.map((d, idx) => ({
              day: idx + 1,
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

        await notifyAllAdmins(
          `Partner "${partnerName}" vừa tạo tour mới và đang chờ duyệt: "${newTour.name}"`,
          "tour_created",
          newTour.id
        );

        toast.success(
          "Tạo tour thành công! Đã gửi thông báo đến tất cả Admin."
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi lưu tour:", error);
      const msg = error.response?.data?.message || "Không thể lưu tour!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-tour-form">
      <h2>{tour ? "Chỉnh sửa Tour" : "Tạo Tour Mới"}</h2>

      <div
        style={{
          marginBottom: "20px",
          textAlign: "center",
          color: "#555",
          fontSize: "0.95rem",
        }}
      >
        Tài khoản: <strong>{user?.full_name || "Partner"}</strong>
        {tour && (
          <span>
            {" "}
            • Đang sửa tour: <strong>{tour.name}</strong>
          </span>
        )}
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
            {loading ? "Đang lưu..." : tour ? "Cập nhật Tour" : "Tạo Tour"}
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
