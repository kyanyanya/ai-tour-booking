// src/pages/PaymentResult.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Hàm tính điểm thưởng dựa trên tổng tiền thanh toán (VND)
  const calculateRewardPoints = (totalAmountVND) => {
    let percent = 0;
    if (totalAmountVND <= 3_000_000) {
      percent = 0.05;
    } else if (totalAmountVND <= 5_000_000) {
      percent = 0.07;
    } else if (totalAmountVND <= 10_000_000) {
      percent = 0.085;
    } else {
      percent = 0.1;
    }

    // Ví dụ: 5% của 1.500.000 = 75.000 → chia 1000 → 75 điểm
    const points = Math.floor((totalAmountVND * percent) / 1000);
    return points;
  };

  useEffect(() => {
    const handlePaymentBack = async () => {
      const responseCode = searchParams.get("vnp_ResponseCode");
      const bookingId = searchParams.get("vnp_TxnRef");
      const transactionNo = searchParams.get("vnp_TransactionNo");
      const vnpAmount = searchParams.get("vnp_Amount"); // đơn vị: đồng * 100

      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");

      if (!accessToken || !userId) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      if (responseCode === "00" && bookingId && vnpAmount) {
        try {
          const totalPrice = parseInt(vnpAmount, 10) / 100; // chuyển về VND thực tế

          // 1. Cập nhật trạng thái booking
          await axios.patch(
            `${SUPABASE_URL}/rest/v1/bookings?id=eq.${bookingId}`,
            {
              payment_status: "paid",
              status: "confirmed",
              transaction_id: transactionNo,
              payment_method: "vnpay",
              updated_at: new Date().toISOString(),
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

          // 2. Tính số điểm thưởng
          const pointsEarned = calculateRewardPoints(totalPrice);

          // 3. Cộng điểm thưởng cho khách hàng (nếu có điểm)
          if (pointsEarned > 0) {
            try {
              // Lấy điểm hiện tại từ bảng users
              const { data: userData } = await axios.get(
                `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
                {
                  headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );

              if (!userData || userData.length === 0) {
                throw new Error("Không tìm thấy thông tin người dùng");
              }

              const currentPoints = userData[0].reward_points || 0;
              const newPoints = currentPoints + pointsEarned;

              // Cập nhật điểm mới
              await axios.patch(
                `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`,
                {
                  reward_points: newPoints,
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

              toast.success(
                `Thanh toán thành công! Bạn đã nhận được ${pointsEarned.toLocaleString()} điểm thưởng 🎉`
              );
            } catch (pointError) {
              console.error("Lỗi khi cộng điểm thưởng:", pointError);
              toast.warn(
                "Thanh toán thành công nhưng không thể cộng điểm thưởng lúc này. Chúng tôi sẽ xử lý sớm nhất!"
              );
              // Không throw error → vẫn cho success vì tiền đã vào
            }
          } else {
            toast.success("Thanh toán thành công!");
          }

          setStatus("success");
        } catch (err) {
          console.error("Lỗi xử lý thanh toán:", err);
          toast.error(
            "Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng liên hệ hỗ trợ."
          );
          setStatus("error");
        }
      } else {
        // Thanh toán thất bại hoặc bị hủy
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
            <p>
              Hệ thống đã ghi nhận đơn hàng và điểm thưởng (nếu có) của bạn.
            </p>
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
            <p>Giao dịch không thành công hoặc đã bị hủy bởi người dùng.</p>
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
              Quay lại trang thanh toán
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PaymentResult;
