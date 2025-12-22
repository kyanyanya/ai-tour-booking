// src/pages/PaymentResult.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const handlePaymentBack = async () => {
      // 1. Lấy thông tin từ URL VNPay trả về
      const responseCode = searchParams.get("vnp_ResponseCode");
      const bookingId = searchParams.get("vnp_TxnRef");
      const transactionNo = searchParams.get("vnp_TransactionNo");

      // Lấy token từ localStorage (giống trong AuthContext của bạn)
      const accessToken = localStorage.getItem("accessToken");

      if (responseCode === "00" && bookingId) {
        try {
          // 2. Gọi Supabase REST API qua Axios để update bảng bookings
          // Endpoint: [URL]/rest/v1/bookings?id=eq.[bookingId]
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
                Prefer: "return=minimal", // Không cần trả về dữ liệu sau update
              },
            }
          );

          setStatus("success");
        } catch (err) {
          console.error(
            "Lỗi cập nhật Supabase qua Axios:",
            err.response?.data || err.message
          );
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    };

    handlePaymentBack();
  }, [searchParams, SUPABASE_URL, SUPABASE_ANON_KEY]);

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
            <p>Hệ thống đã ghi nhận đơn hàng của bạn.</p>
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
