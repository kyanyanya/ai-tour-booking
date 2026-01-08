// src/pages/Checkout.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import CryptoJS from "crypto-js";
import axios from "axios";
import ConfirmModal from "../components/modals/ConfirmModal";
import "../styles/pages/Checkout.css";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = React.useState("vnpay");
  const [loading, setLoading] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    bookingId,
    tour,
    numberOfPeople = 1,
    totalPrice: originalTotalPrice,
    bookingDate,
  } = location.state || {};

  // Ưu đãi
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const [pointsToUse, setPointsToUse] = React.useState(0);
  const [availableVouchers, setAvailableVouchers] = React.useState([]);
  const [selectedVoucher, setSelectedVoucher] = React.useState(null);
  const [appliedVoucher, setAppliedVoucher] = React.useState(null);

  // Dropdown voucher
  const [isVoucherDropdownOpen, setIsVoucherDropdownOpen] =
    React.useState(false);

  const [finalPrice, setFinalPrice] = React.useState(originalTotalPrice || 0);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const vnp_TmnCode = import.meta.env.VITE_VNP_TMNCODE;
  const vnp_HashSecret = import.meta.env.VITE_VNP_HASHSECRET;
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const vnp_ReturnUrl = `${window.location.origin}/checkout/result`;

  const accessToken = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  // Fetch điểm + voucher đã claim
  React.useEffect(() => {
    if (!bookingId || !tour || !originalTotalPrice || !userId || !accessToken) {
      toast.error("Thông tin thanh toán không hợp lệ!");
      navigate("/tours");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Điểm thưởng
        const { data: userData } = await axios.get(
          `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (userData?.[0]?.reward_points)
          setRewardPoints(userData[0].reward_points);

        // Voucher đã claim
        const { data: voucherData } = await axios.get(
          `${SUPABASE_URL}/rest/v1/vouchers?claimed_by=cs.{${userId}}&select=id,code,discount_amount,tour_id,expires_at,start_date`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const now = new Date();
        const validVouchers = (voucherData || []).filter((v) => {
          const start = v.start_date ? new Date(v.start_date) : null;
          const end = v.expires_at ? new Date(v.expires_at) : null;
          const active = (!start || start <= now) && (!end || end > now);
          const applicable = !v.tour_id || v.tour_id === tour.id;
          return active && applicable;
        });

        setAvailableVouchers(validVouchers);
      } catch (err) {
        console.error("Lỗi tải ưu đãi:", err);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingId,
    tour,
    originalTotalPrice,
    navigate,
    userId,
    accessToken,
    tour.id,
  ]);

  // Tính giá cuối
  React.useEffect(() => {
    let discount = appliedVoucher
      ? appliedVoucher.discount_amount || 0
      : pointsToUse * 700;
    discount = Math.min(discount, originalTotalPrice);
    setFinalPrice(originalTotalPrice - discount);
  }, [pointsToUse, appliedVoucher, originalTotalPrice]);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleSelectVoucher = (voucher) => {
    if (pointsToUse > 0) {
      toast.info("Đã bỏ điểm thưởng để dùng voucher.");
      setPointsToUse(0);
    }
    setSelectedVoucher(voucher);
    setAppliedVoucher({
      code: voucher.code,
      discount_amount: voucher.discount_amount,
    });
    setIsVoucherDropdownOpen(false);
    toast.success(
      `Đã chọn ${voucher.code} – Giảm ${formatPrice(voucher.discount_amount)}`
    );
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
    setAppliedVoucher(null);
    toast.info("Đã bỏ voucher");
  };

  const handlePointsChange = (val) => {
    const pts = Math.min(parseInt(val) || 0, maxPointsCanUse);
    if (pts > 0 && appliedVoucher) {
      toast.info("Đã bỏ voucher để dùng điểm.");
      setAppliedVoucher(null);
      setSelectedVoucher(null);
    }
    setPointsToUse(pts);
  };

  const handleBackToContact = () => {
    navigate("/checkout/contact", {
      state: {
        bookingId,
        tour,
        numberOfPeople,
        totalPrice: originalTotalPrice,
        bookingDate,
      },
    });
  };

  const handleConfirmAndPay = () => setShowConfirmModal(true);

  const handlePay = async () => {
    setShowConfirmModal(false);
    if (paymentMethod !== "vnpay") return toast.info("Vui lòng chọn VNPay!");

    setLoading(true);
    try {
      const date = new Date();
      const createDate =
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");

      const extra = new URLSearchParams();
      if (pointsToUse > 0) extra.append("used_points", pointsToUse);
      if (appliedVoucher) extra.append("used_voucher", appliedVoucher.code);

      const returnUrl = `${vnp_ReturnUrl}?${extra.toString()}`;

      const params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: bookingId,
        vnp_OrderInfo: `Thanh toan tour ${tour.name} - Ma: ${bookingId}`,
        vnp_OrderType: "other",
        vnp_Amount: Math.round(finalPrice * 100),
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate,
      };

      const sorted = Object.keys(params)
        .sort()
        .reduce((o, k) => ({ ...o, [k]: params[k] }), {});
      const signData = new URLSearchParams(sorted).toString();
      const hmac = CryptoJS.HmacSHA512(signData, vnp_HashSecret).toString(
        CryptoJS.enc.Hex
      );
      window.location.assign(`${vnp_Url}?${signData}&vnp_SecureHash=${hmac}`);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối cổng thanh toán!");
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

              <div className="card-info">
                <p>Bạn sẽ được chuyển hướng an toàn đến cổng VNPay.</p>

                <div
                  style={{
                    margin: "20px 0",
                    padding: "14px",
                    background: "#fffbeb",
                    border: "1px solid #fcd34d",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                  }}
                >
                  <strong>Lưu ý:</strong> Chỉ được chọn <strong>MỘT</strong>{" "}
                  hình thức giảm giá: điểm thưởng <strong>HOẶC</strong> voucher.
                </div>

                {/* Điểm thưởng */}
                <div
                  style={{
                    margin: "20px 0",
                    padding: "16px",
                    background: "#f0f7ff",
                    borderRadius: "12px",
                    opacity: appliedVoucher ? 0.6 : 1,
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
                      onChange={(e) => handlePointsChange(e.target.value)}
                      placeholder="Số điểm dùng"
                      style={{
                        width: "120px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                      disabled={!!appliedVoucher}
                    />
                    <span>→ Giảm {formatPrice(pointsToUse * 700)}</span>
                  </div>
                </div>

                {/* Dropdown Voucher */}
                <div style={{ margin: "20px 0", position: "relative" }}>
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                    Chọn voucher
                  </p>

                  <div
                    onClick={() =>
                      pointsToUse === 0 &&
                      setIsVoucherDropdownOpen(!isVoucherDropdownOpen)
                    }
                    style={{
                      padding: "14px 16px",
                      border: "2px solid",
                      borderColor: selectedVoucher ? "#4361ee" : "#ddd",
                      borderRadius: "12px",
                      background: "#fff",
                      cursor: pointsToUse > 0 ? "not-allowed" : "pointer",
                      opacity: pointsToUse > 0 ? 0.6 : 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: selectedVoucher ? "600" : "normal",
                    }}
                  >
                    <span>
                      {selectedVoucher
                        ? `${selectedVoucher.code} → Giảm ${formatPrice(
                            selectedVoucher.discount_amount
                          )}`
                        : "Nhấn để chọn voucher..."}
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>▼</span>
                  </div>

                  {isVoucherDropdownOpen && availableVouchers.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "12px",
                        marginTop: "6px",
                        maxHeight: "280px",
                        overflowY: "auto",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      {availableVouchers.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => handleSelectVoucher(v)}
                          style={{
                            padding: "14px 16px",
                            borderBottom: "1px solid #eee",
                            cursor: "pointer",
                            background:
                              selectedVoucher?.id === v.id
                                ? "#f0f7ff"
                                : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#f8faff")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background =
                              selectedVoucher?.id === v.id
                                ? "#f0f7ff"
                                : "white")
                          }
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <strong>{v.code}</strong>
                            <span
                              style={{ color: "#dc2626", fontWeight: "600" }}
                            >
                              -{formatPrice(v.discount_amount)}
                            </span>
                          </div>
                          {v.tour_id && (
                            <small style={{ color: "#666" }}>
                              Chỉ áp dụng cho tour cụ thể
                            </small>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {appliedVoucher && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "10px",
                        background: "#d4edda",
                        borderRadius: "10px",
                        textAlign: "center",
                      }}
                    >
                      <p style={{ margin: "0 0 8px 0" }}>
                        Đang dùng: <strong>{appliedVoucher.code}</strong> → Giảm{" "}
                        {formatPrice(appliedVoucher.discount_amount)}
                      </p>
                      <button
                        onClick={handleRemoveVoucher}
                        style={{
                          color: "#dc2626",
                          background: "none",
                          border: "none",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        Bỏ áp dụng
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
                    <strong>Thẻ Test NCB (Demo):</strong>
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
                {pointsToUse > 0 && !appliedVoucher && (
                  <div className="price-row discount">
                    <span>Giảm điểm thưởng ({pointsToUse} điểm)</span>
                    <span>-{formatPrice(pointsToUse * 700)}</span>
                  </div>
                )}
                {appliedVoucher && !pointsToUse && (
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
                <button className="btn-back" onClick={handleBackToContact}>
                  ← Quay lại
                </button>
                <button
                  className="btn-pay"
                  onClick={handleConfirmAndPay}
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

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Xác nhận thanh toán"
        message="Khi thanh toán thành công bạn sẽ không thể cập nhật lại thông tin, hãy đảm bảo bạn đã điền đúng và đủ thông tin nhé!"
        onConfirm={handlePay}
        onCancel={() => setShowConfirmModal(false)}
      />

      <Footer />
    </>
  );
};

export default Checkout;
