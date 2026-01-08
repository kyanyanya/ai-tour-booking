// src/pages/PaymentResult.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  const hasProcessed = useRef(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const calculateRewardPoints = (totalAmountVND) => {
    let percent = 0;
    if (totalAmountVND <= 3000000) percent = 0.05;
    else if (totalAmountVND <= 5000000) percent = 0.07;
    else if (totalAmountVND <= 10000000) percent = 0.085;
    else percent = 0.1;

    return Math.floor((totalAmountVND * percent) / 1000);
  };

  useEffect(() => {
    const handlePaymentResult = async () => {
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

      if (responseCode !== "00" || !bookingId || !vnpAmount) {
        toast.error("Thanh toán không thành công hoặc đã bị hủy.");
        setStatus("error");
        return;
      }

      let pointsEarned = 0;
      let voucherMessage = "";

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

          if (!userData?.length) throw new Error("Không tìm thấy user");

          let currentPoints = userData[0].reward_points || 0;

          if (usedPoints > 0) {
            if (currentPoints < usedPoints) {
              usedPoints = currentPoints;
              toast.warn("Điểm sử dụng vượt quá, chỉ trừ hết điểm hiện có.");
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

        // 3. Xóa userId khỏi claimed_by của voucher (đúng logic bạn muốn)
        if (usedVoucherCode) {
          // Tìm voucher
          const { data: voucherData } = await axios.get(
            `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(
              usedVoucherCode
            )}&select=id,claimed_by`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (voucherData?.length > 0) {
            const voucher = voucherData[0];
            const currentClaimed = voucher.claimed_by || [];

            // Xóa userId khỏi mảng
            const updatedClaimed = currentClaimed.filter((id) => id !== userId);

            // Cập nhật lại
            await axios.patch(
              `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`,
              { claimed_by: updatedClaimed },
              {
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
              }
            );

            voucherMessage = `Voucher ${usedVoucherCode} đã được sử dụng và xóa khỏi danh sách của bạn.`;
          }
        }

        // Thông báo
        toast.success("Thanh toán thành công! Đơn hàng đã xác nhận.");
        if (voucherMessage) toast.success(voucherMessage);
        if (pointsEarned > 0) {
          toast.success(
            `Nhận thêm ${pointsEarned.toLocaleString()} điểm thưởng! 🎉`
          );
        }

        setStatus("success");
      } catch (err) {
        console.error("Lỗi xử lý:", err);
        toast.error("Lỗi xử lý đơn hàng. Vui lòng liên hệ hỗ trợ.");
        setStatus("error");
      }
    };

    handlePaymentResult();
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
            <p>Đơn hàng đã được ghi nhận và xử lý hoàn tất.</p>
            <p>Chúc bạn có chuyến đi vui vẻ!</p>
            <button
              onClick={() => navigate("/customer")}
              style={{
                padding: "12px 28px",
                marginTop: "24px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1.1rem",
              }}
            >
              Xem đơn hàng của tôi
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
                padding: "12px 28px",
                marginTop: "24px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1.1rem",
              }}
            >
              Thử thanh toán lại
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PaymentResult;
