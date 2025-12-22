// src/pages/Checkout.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import "../styles/pages/Checkout.css";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = React.useState("card");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    bookingId,
    tour,
    numberOfPeople = 1,
    totalPrice,
    bookingDate,
  } = location.state || {};

  React.useEffect(() => {
    if (!bookingId || !tour || !totalPrice) {
      toast.error("Thông tin thanh toán không hợp lệ!");
      navigate("/tours");
    }
  }, [bookingId, tour, totalPrice, navigate]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handlePay = async () => {
    if (paymentMethod !== "card") {
      toast.info("Phương thức này chưa được hỗ trợ!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-vnpay-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            totalPrice,
            bookingId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi server: ${response.status} - ${errorText}`);
      }

      const { paymentUrl } = await response.json();

      if (!paymentUrl) {
        throw new Error("Không nhận được URL thanh toán");
      }

      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Lỗi thanh toán:", err);
      toast.error("Không thể tạo thanh toán. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  if (!tour) return null;

  return (
    <>
      <Header />

      <div className="checkout-container">
        <div className="checkout-wrapper">
          <div className="breadcrumb">
            <div className="breadcrumb-left">
              <h1>Thanh toán • Bước 2: Thông tin thanh toán</h1>
              <p>Giao dịch được mã hóa và bảo mật bởi Stripe</p>
            </div>
            <div className="breadcrumb-steps">
              <span className="step-past">Bước 1/2</span>
              <span className="step-current">Bước 2/2</span>
            </div>
          </div>

          <div className="checkout-main">
            <div className="payment-section">
              <h2>Phương thức thanh toán</h2>

              <div className="payment-options">
                <div
                  className={`option ${
                    paymentMethod === "card" ? "active" : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <span className="icon">
                    Thẻ tín dụng / Thẻ ghi nợ (Stripe)
                  </span>
                  <span className="tag">Khuyến nghị</span>
                </div>
              </div>

              {paymentMethod === "card" && (
                <div className="card-info">
                  <p>
                    Bạn sẽ được chuyển hướng đến cổng thanh toán Stripe để hoàn
                    tất.
                  </p>
                  <p>
                    <strong>Tổng thanh toán: {formatPrice(totalPrice)}</strong>
                  </p>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#d32f2f",
                      marginTop: "10px",
                    }}
                  >
                    <strong>Thẻ test:</strong> 4242 4242 4242 4242 | Ngày bất kỳ
                    | CVC bất kỳ
                  </p>
                </div>
              )}
            </div>

            <div className="summary-section">
              {/* Giữ nguyên tóm tắt đơn hàng như cũ */}
              <h3>Tóm tắt đơn hàng</h3>
              <div className="order-item">
                <img
                  src={tour.image || "https://via.placeholder.com/200"}
                  alt={tour.name}
                />
                <div className="order-info">
                  <h4>{tour.name}</h4>
                  <p>
                    {tour.location} |{" "}
                    {new Date(bookingDate).toLocaleDateString("vi-VN")}
                  </p>
                  <p>{numberOfPeople} người lớn</p>
                </div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Giá tour</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="price-row">
                  <span>Phí xử lý</span>
                  <span>0đ</span>
                </div>
                <div className="price-total">
                  <span>Tổng thanh toán</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="security-badge">
                <span>Thanh toán an toàn với Stripe • SSL 256-bit</span>
              </div>

              <div className="action-buttons">
                <button className="btn-back" onClick={() => navigate(-1)}>
                  Quay lại
                </button>
                <button
                  className="btn-pay"
                  onClick={handlePay}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Thanh toán & hoàn tất"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
