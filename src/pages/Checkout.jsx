import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
import "../styles/pages/Checkout.css";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = React.useState("vnpay");
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

  // LẤY CẤU HÌNH TỪ BIẾN MÔI TRƯỜNG (.ENV)
  const vnp_TmnCode = import.meta.env.VITE_VNP_TMNCODE;
  const vnp_HashSecret = import.meta.env.VITE_VNP_HASHSECRET;
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const vnp_ReturnUrl = "https://ai-tour-booking.vercel.app/checkout/result";

  React.useEffect(() => {
    if (!bookingId || !tour || !totalPrice) {
      toast.error("Thông tin thanh toán không hợp lệ!");
      navigate("/tours");
    }
  }, [bookingId, tour, totalPrice, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handlePay = async () => {
    if (paymentMethod !== "vnpay") {
      toast.info("Vui lòng chọn phương thức VNPay!");
      return;
    }

    setLoading(true);

    try {
      const date = new Date();
      // Định dạng thời gian theo yêu cầu VNPay: yyyyMMddHHmmss
      const createDate =
        date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        date.getDate().toString().padStart(2, "0") +
        date.getHours().toString().padStart(2, "0") +
        date.getMinutes().toString().padStart(2, "0") +
        date.getSeconds().toString().padStart(2, "0");

      let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: bookingId,
        vnp_OrderInfo: `Thanh toan tour ${tour.name} - Ma: ${bookingId}`,
        vnp_OrderType: "other",
        vnp_Amount: Math.round(totalPrice * 100), // Nhân 100 và làm tròn để tránh số thập phân
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate,
      };

      // 1. Sắp xếp các tham số theo alphabet (bắt buộc đối với VNPay)
      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((obj, key) => {
          obj[key] = vnp_Params[key];
          return obj;
        }, {});

      // 2. Tạo chuỗi query string
      const signData = new URLSearchParams(sortedParams).toString();

      // 3. Tạo chữ ký HMAC-SHA512 bằng CryptoJS
      const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret).toString(
        CryptoJS.enc.Hex
      );

      // 4. Tạo URL thanh toán hoàn chỉnh
      const finalUrl = `${vnp_Url}?${signData}&vnp_SecureHash=${hmac}`;

      // Chuyển hướng sang VNPay bằng assign để vượt lỗi ESLint
      window.location.assign(finalUrl);
    } catch (err) {
      console.error("Lỗi thanh toán VNPay:", err);
      toast.error("Không thể kết nối cổng thanh toán. Vui lòng thử lại!");
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
              <p>Hệ thống hỗ trợ thanh toán qua VNPay Sandbox</p>
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
                    paymentMethod === "vnpay" ? "active" : ""
                  }`}
                  onClick={() => setPaymentMethod("vnpay")}
                >
                  <span className="icon">VNPay (ATM / Ngân hàng nội địa)</span>
                  <span className="tag">Sandbox</span>
                </div>
              </div>

              <div className="card-info">
                <p>Bạn sẽ được chuyển hướng an toàn đến cổng VNPay.</p>
                <p>
                  <strong>Tổng tiền: {formatPrice(totalPrice)}</strong>
                </p>

                <div
                  style={{
                    fontSize: "0.85rem",
                    background: "#fdf2f2",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "15px",
                    border: "1px solid #ffcdd2",
                  }}
                >
                  <p>
                    <strong>Thẻ Test NCB (Dành cho Demo):</strong>
                  </p>
                  <p>Số thẻ: 9704198526191432198</p>
                  <p>Tên: NGUYEN VAN A | Ngày: 07/15 | OTP: 123456</p>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h3>Tóm tắt chuyến đi</h3>
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
                  <p>{numberOfPeople} người</p>
                </div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="price-total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
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
                  {loading ? "Đang kết nối..." : "Xác nhận & Thanh toán"}
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
