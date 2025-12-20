// src/components/forms/CreateTourForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/components/forms/CreateTourForm.css";

const CreateTourForm = ({ onClose, onSuccess, tour }) => {
  const { user, session } = useAuth();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

  const [compressedImage, setCompressedImage] = useState(null); // File dùng để upload (gốc hoặc đã nén)
  const [imagePreview, setImagePreview] = useState(""); // URL preview ảnh
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // Load dữ liệu khi chỉnh sửa tour
  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name || "",
        description: tour.description || "",
        price: tour.price || "",
        location: tour.location || "",
        duration_days: tour.duration_days || "",
      });

      if (tour.image) {
        setImagePreview(tour.image);
      }

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
      }
    }
  }, [tour]);

  // Hàm nén ảnh (chỉ chạy khi ảnh > 5MB)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          if (file.size > 8 * 1024 * 1024) quality = 0.6; // >8MB nén mạnh hơn

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Xử lý khi người dùng chọn ảnh
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một file ảnh!");
      return;
    }

    // Tạo preview từ file gốc
    setImagePreview(URL.createObjectURL(file));

    // Nếu ảnh > 5MB → nén tự động
    if (file.size > 5 * 1024 * 1024) {
      toast.info("Ảnh lớn hơn 5MB, đang nén tự động để upload nhanh hơn...");
      const compressed = await compressImage(file);
      setCompressedImage(compressed);
      toast.success(
        `Đã nén ảnh xuống ${(compressed.size / 1024 / 1024).toFixed(2)} MB`
      );
    } else {
      // Ảnh nhỏ → dùng luôn file gốc
      setCompressedImage(file);
    }
  };

  // Upload ảnh bằng Axios (Supabase Storage REST API)
  const uploadImageWithAxios = async (tourId) => {
    if (!compressedImage || !tourId) return null;

    setUploading(true);
    try {
      const fileExt = compressedImage.name.split(".").pop().toLowerCase();
      const fileName = `${tourId}.${fileExt}`;

      // Upload file (không cần lấy data response vì Supabase trả về {} khi thành công)
      await axios.post(
        `${supabaseUrl}/storage/v1/object/tour_card_image/${fileName}`,
        compressedImage,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": compressedImage.type || "application/octet-stream",
            "x-upsert": "true", // Ghi đè nếu đã tồn tại (khi chỉnh sửa)
          },
        }
      );

      // Trả về public URL
      return `${supabaseUrl}/storage/v1/object/public/tour_card_image/${fileName}`;
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      toast.error("Không thể upload ảnh tour!");
      return null;
    } finally {
      setUploading(false);
    }
  };

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
      console.error("Lỗi lấy danh sách admin:", err);
      return [];
    }
  };

  // Gửi thông báo đến tất cả Admin
  const notifyAllAdmins = async (message, type, tourId = null) => {
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
      console.error("Lỗi gửi thông báo:", err);
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

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation cơ bản
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
      let currentTourId = tour?.id;

      // Trường hợp: Tạo mới + có ảnh → tạo tour trước để lấy ID rồi upload ảnh
      if (!tour && compressedImage) {
        const createRes = await axios.post(
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

        currentTourId = createRes.data[0].id;
        const imageUrl = await uploadImageWithAxios(currentTourId);

        if (imageUrl) {
          await axios.patch(
            `${supabaseUrl}/rest/v1/tours?id=eq.${currentTourId}`,
            { image: imageUrl },
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${session?.access_token}`,
              },
            }
          );
        }

        await notifyAllAdmins(
          `Partner "${partnerName}" vừa tạo tour mới và đang chờ duyệt: "${tourName}"`,
          "tour_created",
          currentTourId
        );
        toast.success("Tạo tour thành công!");
      } else {
        // Chỉnh sửa tour hoặc tạo mới không có ảnh
        const payload = {
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
        };

        if (compressedImage) {
          const imageUrl = await uploadImageWithAxios(
            tour ? tour.id : currentTourId
          );
          if (imageUrl) payload.image = imageUrl;
        }

        if (tour) {
          await axios.patch(
            `${supabaseUrl}/rest/v1/tours?id=eq.${tour.id}`,
            payload,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${session?.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          await notifyAllAdmins(
            `Partner "${partnerName}" đã cập nhật tour "${tourName}" và đang chờ duyệt lại.`,
            "tour_updated",
            tour.id
          );
          toast.success("Cập nhật tour thành công!");
        } else {
          // Tạo mới không có ảnh
          const createRes = await axios.post(
            `${supabaseUrl}/rest/v1/tours`,
            {
              partner_id: user.id,
              partner_name: partnerName,
              ...payload,
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

          await notifyAllAdmins(
            `Partner "${partnerName}" vừa tạo tour mới và đang chờ duyệt: "${tourName}"`,
            "tour_created",
            createRes.data[0].id
          );
          toast.success("Tạo tour thành công!");
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi lưu tour:", err);
      toast.error(err.response?.data?.message || "Không thể lưu tour!");
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
          <>
            {" "}
            • Đang sửa tour: <strong>{tour.name}</strong>
          </>
        )}
      </div>

      {/* === PHẦN UPLOAD ẢNH === */}
      <div className="image-upload-section">
        <label>Ảnh đại diện tour (khuyến khích)</label>
        <div
          className="image-preview-container"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview tour"
              className="image-preview"
            />
          ) : (
            <div className="image-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#aaa">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14l-5-5-4 4V5h14v10l-5-5-5 5z" />
              </svg>
              <p>Nhấp để chọn ảnh (tự động nén nếu lớn)</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        {compressedImage && (
          <p className="image-filename">
            {compressedImage.name} (
            {(compressedImage.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        {uploading && (
          <p style={{ color: "#4361ee", textAlign: "center" }}>
            Đang upload ảnh...
          </p>
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
          disabled={loading || uploading}
        />

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả tour (khuyến khích)"
          rows={3}
          disabled={loading || uploading}
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
            disabled={loading || uploading}
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Địa điểm (VD: Đà Lạt)"
            disabled={loading || uploading}
          />
        </div>

        <input
          type="number"
          name="duration_days"
          value={formData.duration_days}
          onChange={handleChange}
          placeholder="Số ngày (VD: 3)"
          min="1"
          disabled={loading || uploading}
        />

        <div className="itinerary-section">
          <div className="itinerary-header">
            <h3>Lịch trình chi tiết</h3>
            <button
              type="button"
              className="btn-add-day"
              onClick={addDay}
              disabled={loading || uploading}
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
                    disabled={loading || uploading}
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
                disabled={loading || uploading}
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || uploading}
          >
            {loading || uploading
              ? "Đang xử lý..."
              : tour
              ? "Cập nhật Tour"
              : "Tạo Tour"}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading || uploading}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTourForm;
