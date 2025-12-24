// src/pages/PaymentResult.jsx
import React, { useEffect, useState, useRef } from "react"; // ← Thêm useRef
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  const hasProcessed = useRef(false); // ← Cờ kiểm tra đã xử lý

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const calculateRewardPoints = (totalAmountVND) => {
    let percent = 0;
    if (totalAmountVND <= 3_000_000) percent = 0.05;
    else if (totalAmountVND <= 5_000_000) percent = 0.07;
    else if (totalAmountVND <= 10_000_000) percent = 0.085;
    else percent = 0.1;

    return Math.floor((totalAmountVND * percent) / 1000);
  };

  useEffect(() => {
    const handlePaymentBack = async () => {
      // ← NGĂN CHẠY LẦN 2 (do React Strict Mode)
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const responseCode = searchParams.get("vnp_ResponseCode");
      const bookingId = searchParams.get("vnp_TxnRef");
      const transactionNo = searchParams.get("vnp_TransactionNo");
      const vnpAmount = searchParams.get("vnp_Amount");

      let usedPoints = parseInt(searchParams.get("used_points")) || 0;
      const usedVoucherCode = searchParams.get("used_voucher") || null;

      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      if (!accessToken || !userId) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      if (responseCode === "00" && bookingId && vnpAmount) {
        let pointsEarned = 0;
        let voucherUsedMessage = "";

        try {
          const totalPrice = parseInt(vnpAmount, 10) / 100;

          // 1. Cập nhật booking
          await axios.patch(
            `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
            {
              payment_status: "paid",
              status: "confirmed",
              transaction_id: transactionNo,
              payment_method: "vnpay",
              updated_at: new Date().toISOString(),
              used_points: usedPoints > 0 ? usedPoints : null,
              used_voucher: usedVoucherCode,
            },
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
            }
          );

          // 2. Xử lý điểm thưởng
          if (usedPoints > 0 || totalPrice > 0) {
            const { data: userData } = await axios.get(
              `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
              {
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (!userData || userData.length === 0)
              throw new Error("Không tìm thấy người dùng");

            let currentPoints = userData[0].reward_points || 0;

            if (usedPoints > 0) {
              if (currentPoints < usedPoints) {
                toast.warn(
                  "Số điểm sử dụng lớn hơn điểm hiện có. Chỉ trừ điểm hiện có."
                );
                usedPoints = currentPoints;
              }
              currentPoints -= usedPoints;
            }

            pointsEarned = calculateRewardPoints(totalPrice);
            if (pointsEarned > 0) currentPoints += pointsEarned;

            await axios.patch(
              `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`,
              { reward_points: currentPoints },
              {
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
              }
            );
          }

          // 3. Xử lý voucher đã dùng
          if (usedVoucherCode) {
            try {
              const { data: userData } = await axios.get(
                `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=voucher_codes`,
                {
                  headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (userData && userData.length > 0) {
                const currentCodes = userData[0].voucher_codes || [];
                const updatedCodes = currentCodes.filter(
                  (code) => code !== usedVoucherCode
                );

                await axios.patch(
                  `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`,
                  { voucher_codes: updatedCodes },
                  {
                    headers: {
                      apikey: SUPABASE_ANON_KEY,
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                voucherUsedMessage = `Voucher ${usedVoucherCode} đã được sử dụng và xóa khỏi danh sách.`;
              }
            } catch (voucherErr) {
              console.error("Lỗi xóa voucher:", voucherErr);
              voucherUsedMessage = "Không thể xóa voucher đã dùng.";
            }
          }
        } catch (err) {
          console.error("Lỗi xử lý thanh toán:", err);
          toast.error("Có lỗi khi xử lý đơn hàng. Vui lòng liên hệ hỗ trợ.");
          setStatus("success");
          return;
        }

        // === HIỆN THÔNG BÁO THÀNH CÔNG CHỈ 1 LẦN ===
        let mainMessage = "Bạn đã thanh toán thành công!";
        if (voucherUsedMessage) {
          mainMessage += ` ${voucherUsedMessage}`;
        }
        toast.success(mainMessage);

        if (pointsEarned > 0) {
          toast.success(
            `Bạn được cộng thêm ${pointsEarned.toLocaleString()} điểm tích lũy! 🎉`
          );
        }

        setStatus("success");
      } else {
        toast.error("Thanh toán không thành công hoặc đã bị hủy.");
        setStatus("error");
      }
    };

    handlePaymentBack();
  }, [searchParams, SUPABASE_URL, SUPABASE_ANON_KEY, navigate]);

  return (
    <>
      <Header />
      <div
        style={{
          textAlign: "center",
          padding: "100px 20px",
          minHeight: "60vh",
        }}
      >
        {status === "loading" && <h2>Đang xác thực giao dịch...</h2>}

        {status === "success" && (
          <div>
            <h1 style={{ color: "#2ecc71", fontSize: "3rem" }}>✓</h1>
            <h2 style={{ color: "#2ecc71" }}>Thanh toán thành công!</h2>
            <p>Đơn hàng đã được ghi nhận và xử lý thành công.</p>
            <button
              onClick={() => navigate("/customer")}
              style={{
                padding: "10px 25px",
                marginTop: "20px",
                cursor: "pointer",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "1rem",
              }}
            >
              Quản lý chuyến đi
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <h1 style={{ color: "#e74c3c", fontSize: "3rem" }}>✕</h1>
            <h2 style={{ color: "#e74c3c" }}>Thanh toán thất bại</h2>
            <p>Giao dịch không thành công hoặc đã bị hủy.</p>
            <button
              onClick={() => navigate("/checkout")}
              style={{
                padding: "10px 25px",
                marginTop: "20px",
                cursor: "pointer",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "1rem",
              }}
            >
              Quay lại thanh toán
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PaymentResult;
