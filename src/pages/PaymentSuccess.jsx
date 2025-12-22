import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div style={{ textAlign: "center", padding: "100px" }}>
        <h1>Thanh toán thành công!</h1>
        <p>Cảm ơn bạn đã đặt tour.</p>
        <p>Mã đặt tour: {bookingId}</p>
        <button onClick={() => navigate("/tours")}>
          Quay lại danh sách tour
        </button>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;
