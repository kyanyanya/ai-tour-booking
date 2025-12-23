// src/pages/Checkout.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
import axios from "axios";
import "../styles/pages/Checkout.css";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = React.useState("vnpay");
  const [loading, setLoading] = React.useState(false);
  const [applying, setApplying] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    bookingId,
    tour,
    numberOfPeople = 1,
    totalPrice: originalTotalPrice, // giá gốc
    bookingDate,
  } = location.state || {};

  // State mới cho ưu đãi
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const [pointsToUse, setPointsToUse] = React.useState(0);
  const [voucherCode, setVoucherCode] = React.useState("");
  const [appliedVoucher, setAppliedVoucher] = React.useState(null); // { code, discount_amount }

  const [finalPrice, setFinalPrice] = React.useState(originalTotalPrice || 0);

  // Env vars
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const vnp_TmnCode = import.meta.env.VITE_VNP_TMNCODE;
  const vnp_HashSecret = import.meta.env.VITE_VNP_HASHSECRET;
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const vnp_ReturnUrl = `${window.location.origin}/checkout/result`;

  const accessToken = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  // Fetch điểm thưởng và cập nhật final price
  React.useEffect(() => {
    if (!bookingId || !tour || !originalTotalPrice || !userId || !accessToken) {
      toast.error("Thông tin thanh toán không hợp lệ!");
      navigate("/tours");
      return;
    }

    const fetchRewardPoints = async () => {
      try {
        const { data } = await axios.get(
          `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (data && data.length > 0) {
          setRewardPoints(data[0].reward_points || 0);
        }
      } catch (err) {
        console.error("Lỗi lấy điểm thưởng:", err);
      }
    };

    fetchRewardPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, tour, originalTotalPrice, navigate, userId, accessToken]);

  // Tính lại giá cuối khi thay đổi điểm hoặc voucher
  React.useEffect(() => {
    let discountFromPoints = pointsToUse * 700;
    let discountFromVoucher = appliedVoucher?.discount_amount || 0;

    // Không được giảm quá tổng tiền
    const totalDiscount = Math.min(
      discountFromPoints + discountFromVoucher,
      originalTotalPrice
    );
    setFinalPrice(originalTotalPrice - totalDiscount);
  }, [pointsToUse, appliedVoucher, originalTotalPrice]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Áp dụng voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã voucher!");
      return;
    }

    setApplying(true);
    try {
      const { data: vouchers } = await axios.get(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${voucherCode
          .trim()
          .toUpperCase()}&used_by=is.null`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!vouchers || vouchers.length === 0) {
        toast.error("Mã voucher không hợp lệ hoặc đã được sử dụng!");
        return;
      }

      const voucher = vouchers[0];

      // Kiểm tra hết hạn
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        toast.error("Voucher đã hết hạn!");
        return;
      }

      // Kiểm tra áp dụng: nếu có owner_id (từ partner) thì phải cùng tour
      if (voucher.owner_id && voucher.tour_id && voucher.tour_id !== tour.id) {
        toast.error("Voucher này chỉ áp dụng cho tour khác!");
        return;
      }

      setAppliedVoucher({
        code: voucher.code,
        discount_amount: voucher.discount_amount,
      });
      toast.success(
        `Áp dụng voucher ${voucher.code} thành công! Giảm ${formatPrice(
          voucher.discount_amount
        )}`
      );
      setVoucherCode("");
    } catch (err) {
      console.error("Lỗi áp dụng voucher:", err);
      toast.error("Không thể kiểm tra voucher. Vui lòng thử lại.");
    } finally {
      setApplying(false);
    }
  };

  // Xóa voucher đã áp dụng
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    toast.info("Đã xóa voucher");
  };

  const handlePay = async () => {
    if (paymentMethod !== "vnpay") {
      toast.info("Vui lòng chọn phương thức VNPay!");
      return;
    }

    setLoading(true);

    try {
      const date = new Date();
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
        vnp_Amount: Math.round(finalPrice * 100), // Dùng giá cuối cùng sau ưu đãi
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate,
      };

      const sortedParams = Object.keys(vnp_Params)
        .sort()
        .reduce((obj, key) => {
          obj[key] = vnp_Params[key];
          return obj;
        }, {});

      const signData = new URLSearchParams(sortedParams).toString();
      const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret).toString(
        CryptoJS.enc.Hex
      );

      const finalUrl = `${vnp_Url}?${signData}&vnp_SecureHash=${hmac}`;

      window.location.assign(finalUrl);
    } catch (err) {
      console.error("Lỗi thanh toán VNPay:", err);
      toast.error("Không thể kết nối cổng thanh toán. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  if (!tour) return null;

  const maxPointsCanUse = Math.floor(originalTotalPrice / 700);

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

              {/* Phần ưu đãi mới */}
              <div className="card-info">
                <p>Bạn sẽ được chuyển hướng an toàn đến cổng VNPay.</p>

                {/* Điểm thưởng */}
                <div
                  style={{
                    margin: "20px 0",
                    padding: "16px",
                    background: "#f0f7ff",
                    borderRadius: "12px",
                  }}
                >
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                    Điểm thưởng khả dụng:{" "}
                    <strong>{rewardPoints.toLocaleString()} điểm</strong>
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#555" }}>
                    1 điểm = 700đ
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      max={maxPointsCanUse}
                      value={pointsToUse}
                      onChange={(e) =>
                        setPointsToUse(
                          Math.min(
                            parseInt(e.target.value) || 0,
                            maxPointsCanUse
                          )
                        )
                      }
                      placeholder="Số điểm muốn dùng"
                      style={{
                        width: "120px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                    <span>→ Giảm {formatPrice(pointsToUse * 700)}</span>
                  </div>
                  {pointsToUse > 0 && pointsToUse <= rewardPoints && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#4361ee",
                        marginTop: "6px",
                      }}
                    >
                      Sau khi dùng: {rewardPoints - pointsToUse} điểm còn lại
                    </p>
                  )}
                </div>

                {/* Voucher */}
                <div
                  style={{
                    margin: "20px 0",
                    padding: "16px",
                    background: "#fff8e1",
                    borderRadius: "12px",
                  }}
                >
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                    Áp dụng mã giảm giá
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã voucher"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                      disabled={applying}
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={applying || !voucherCode.trim()}
                      style={{
                        padding: "8px 16px",
                        background: "#4361ee",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {applying ? "..." : "Áp dụng"}
                    </button>
                  </div>

                  {appliedVoucher && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px",
                        background: "#d4edda",
                        borderRadius: "8px",
                      }}
                    >
                      <p style={{ margin: "0 0 8px 0" }}>
                        Đã áp dụng: <strong>{appliedVoucher.code}</strong> →
                        Giảm {formatPrice(appliedVoucher.discount_amount)}
                      </p>
                      <button
                        onClick={handleRemoveVoucher}
                        style={{
                          fontSize: "0.85rem",
                          color: "#dc2626",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    color: "#1e293b",
                  }}
                >
                  Số tiền cần thanh toán:{" "}
                  <span style={{ color: "#e74c3c" }}>
                    {formatPrice(finalPrice)}
                  </span>
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
                  <span>{formatPrice(originalTotalPrice)}</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="price-row discount">
                    <span>Giảm điểm thưởng ({pointsToUse} điểm)</span>
                    <span>-{formatPrice(pointsToUse * 700)}</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="price-row discount">
                    <span>Giảm voucher ({appliedVoucher.code})</span>
                    <span>-{formatPrice(appliedVoucher.discount_amount)}</span>
                  </div>
                )}
                <div className="price-total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(finalPrice)}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn-back" onClick={() => navigate(-1)}>
                  Quay lại
                </button>
                <button
                  className="btn-pay"
                  onClick={handlePay}
                  disabled={loading || finalPrice <= 0}
                >
                  {loading
                    ? "Đang kết nối..."
                    : finalPrice <= 0
                    ? "Miễn phí"
                    : "Xác nhận & Thanh toán"}
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
