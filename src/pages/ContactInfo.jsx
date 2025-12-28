// src/pages/ContactInfo.jsx
import React, { useState, useEffect } from "react";
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
  const { session, user } = useAuth();

  const {
    bookingId,
    tour,
    numberOfPeople = 1,
    totalPrice,
    bookingDate,
  } = location.state || {};

  // Redirect nếu thiếu dữ liệu
  useEffect(() => {
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
  const accessToken = session?.access_token;
  const userId = user?.id || session?.user?.id;

  // Fetch dữ liệu theo thứ tự ưu tiên: bookings → users
  useEffect(() => {
    if (!bookingId || !accessToken) return;

    const fetchContactInfo = async () => {
      try {
        // Bước 1: Ưu tiên lấy thông tin từ bảng bookings (nếu có)
        const { data: bookingData } = await axios.get(
          `${supabaseUrl}/rest/v1/bookings?id=eq.${bookingId}&select=contact_name,contact_email,contact_phone,contact_country,notes`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (bookingData && bookingData.length > 0) {
          const booking = bookingData[0];
          // Nếu có bất kỳ thông tin nào trong booking → dùng nó (ưu tiên cao nhất)
          if (
            booking.contact_name ||
            booking.contact_email ||
            booking.contact_phone
          ) {
            setContactName(booking.contact_name || "");
            setContactEmail(booking.contact_email || "");
            setContactPhone(booking.contact_phone || "");
            setContactCountry(booking.contact_country || "Việt Nam");
            setNotes(booking.notes || "");
            console.log("Đã lấy thông tin từ bảng bookings (ưu tiên cao nhất)");
            return; // Dừng lại, không cần fetch từ users nữa
          }
        }

        // Bước 2: Nếu không có trong bookings → lấy từ bảng users
        if (!userId) return;

        const { data: userData } = await axios.get(
          `${supabaseUrl}/rest/v1/users?user_id=eq.${userId}&select=full_name,email,phone_number`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (userData && userData.length > 0) {
          const userInfo = userData[0];
          setContactName(userInfo.full_name || "");
          setContactEmail(userInfo.email || "");
          setContactPhone(userInfo.phone_number || "");
          console.log("Đã lấy thông tin từ bảng users (fallback)");
        }
      } catch (err) {
        console.error("Lỗi khi fetch thông tin liên hệ:", err);
        // Không hiện toast để tránh làm phiền người dùng
      }
    };

    fetchContactInfo();
  }, [bookingId, userId, accessToken, supabaseUrl, anonKey]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleContinue = async () => {
    if (!contactName.trim()) {
      toast.error("Vui lòng nhập họ và tên!");
      return;
    }
    if (!contactPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản và chính sách!");
      return;
    }

    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/bookings?id=eq.${bookingId}`,
        {
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim(),
          contact_country: contactCountry,
          notes: notes.trim() || null,
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
        }
      );

      toast.success("Thông tin liên hệ đã được lưu!");

      navigate("/checkout", {
        state: {
          bookingId,
          tour,
          numberOfPeople,
          totalPrice,
          bookingDate,
        },
      });
    } catch (err) {
      console.error("Lỗi cập nhật booking:", err);
      toast.error("Không thể lưu thông tin. Vui lòng thử lại!");
    }
  };

  if (!tour) return null;

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

              {/* Hành khách */}
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

            {/* Right: Order Summary */}
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
