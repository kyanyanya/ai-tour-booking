// src/pages/ContactInfo.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import "../styles/pages/ContactInfo.css";

const ContactInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // Lấy dữ liệu từ state của TourDetailPage
  const {
    bookingId,
    tour,
    numberOfPeople = 1,
    totalPrice,
    bookingDate,
  } = location.state || {};

  // Nếu không có dữ liệu → redirect về trang tour (tránh truy cập trực tiếp)
  React.useEffect(() => {
    if (!bookingId || !tour) {
      toast.error("Thông tin đặt tour không hợp lệ!");
      navigate("/tours");
    }
  }, [bookingId, tour, navigate]);

  // State cho form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCountry, setContactCountry] = useState("Việt Nam");
  const [notes, setNotes] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleContinue = async () => {
    if (!contactName || !contactPhone) {
      toast.error("Vui lòng điền họ tên và số điện thoại!");
      return;
    }
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản và chính sách!");
      return;
    }

    try {
      // Cập nhật thông tin liên hệ vào booking
      await axios.patch(
        `${supabaseUrl}/rest/v1/bookings?id=eq.${bookingId}`,
        {
          contact_name: contactName,
          contact_email: contactEmail || null,
          contact_phone: contactPhone,
          contact_country: contactCountry,
          notes: notes || null,
          // pickup_time nếu bạn muốn lưu riêng, hiện tại để trong notes
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
        }
      );

      toast.success("Thông tin liên hệ đã được lưu!");

      // Chuyển sang trang thanh toán
      navigate("/checkout", {
        state: {
          bookingId,
          tour,
          numberOfPeople,
          totalPrice,
          bookingDate,
          contactInfo: {
            contactName,
            contactEmail,
            contactPhone,
            contactCountry,
            notes,
          },
        },
      });
    } catch (err) {
      console.error("Lỗi cập nhật thông tin liên hệ:", err);
      toast.error("Không thể lưu thông tin. Vui lòng thử lại!");
    }
  };

  if (!tour) {
    return null; // Đang redirect ở useEffect
  }

  return (
    <>
      <Header />

      <div className="ci-container">
        <div className="ci-wrapper">
          {/* Breadcrumb */}
          <div className="ci-breadcrumb">
            <div className="ci-breadcrumb-left">
              <h1>Thanh toán • Bước 1: Thông tin liên hệ</h1>
              <p>
                Điền thông tin hành khách và yêu cầu đặc biệt. Bước tiếp theo:
                nhập thông tin thanh toán.
              </p>
            </div>
            <div className="ci-breadcrumb-steps">
              <span className="ci-step-current">Bước 1/2</span>
              <span className="ci-step-next">Bước 2/2</span>
            </div>
          </div>

          <div className="ci-main">
            {/* Left: Form */}
            <div className="ci-form-section">
              {/* Thông tin người đặt */}
              <div className="ci-section">
                <h3>Thông tin người đặt</h3>
                <div className="ci-input-row">
                  <div className="ci-input-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="ci-input-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="ci-input-row">
                  <div className="ci-input-group">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                  <div className="ci-input-group">
                    <label>Quốc gia/Khu vực</label>
                    <input
                      type="text"
                      placeholder="Quốc gia/Khu vực"
                      value={contactCountry}
                      onChange={(e) => setContactCountry(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Hành khách - hiển thị số lượng đã chọn */}
              <div className="ci-section">
                <h3>Hành khách</h3>
                <div className="ci-input-group full">
                  <label>Số lượng hành khách</label>
                  <div className="ci-passenger-display">
                    <input
                      type="text"
                      value={`${numberOfPeople} người lớn`}
                      readOnly
                    />
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#64748b",
                    marginTop: "8px",
                  }}
                >
                  Bạn có thể chỉnh sửa số lượng ở bước trước.
                </p>
              </div>

              {/* Yêu cầu đặc biệt */}
              <div className="ci-section">
                <h3>Yêu cầu đặc biệt (tùy chọn)</h3>
                <div className="ci-input-group full">
                  <label>
                    Ghi chú cho nhà cung cấp (dị ứng, kỷ niệm, yêu cầu đặc
                    biệt...)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Nhập ghi chú..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
                <div className="ci-input-group full">
                  <label>Giờ đón mong muốn</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 8:00 sáng"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Chính sách & Xác nhận */}
              <div className="ci-section">
                <h3>Chính sách & xác nhận</h3>
                <div className="ci-checkbox-item">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label htmlFor="terms">
                    Tôi đồng ý với Điều khoản dịch vụ & Chính sách hủy tour
                  </label>
                </div>
                <p className="ci-note">
                  Thanh toán ở bước tiếp theo. Bạn có thể xem lại trước khi xác
                  nhận.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="ci-actions">
                <button className="ci-btn-back" onClick={() => navigate(-1)}>
                  Quay lại
                </button>
                <button className="ci-btn-next" onClick={handleContinue}>
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>

            {/* Right: Order Summary - dynamic */}
            <div className="ci-summary-section">
              <h3>Tóm tắt đơn hàng</h3>

              <div className="ci-order-item">
                <img
                  src={tour.image || "https://via.placeholder.com/200"}
                  alt={tour.name}
                />
                <div className="ci-order-info">
                  <h4>{tour.name}</h4>
                  <p>
                    {tour.location} | Ngày khởi hành:{" "}
                    {new Date(bookingDate).toLocaleDateString("vi-VN")}
                  </p>
                  <p>{numberOfPeople} người lớn</p>
                </div>
              </div>

              <div className="ci-price-breakdown">
                <div className="ci-price-row">
                  <span>Giá tour ({numberOfPeople} người)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="ci-price-row">
                  <span>Phí xử lý</span>
                  <span>0đ</span>
                </div>
                <div className="ci-price-total">
                  <span>Tổng tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="ci-security-badge">
                <span>PCI-DSS ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContactInfo;
