// src/pages/Checkout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/Checkout.css";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const navigate = useNavigate();

  return (
    <>
      <Header />

      <div className="checkout-container">
        <div className="checkout-wrapper">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <div className="breadcrumb-left">
              <h1>Thanh toán • Bước 2: Thông tin thanh toán</h1>
              <p>
                Nhập chi tiết thanh toán để hoàn tất đặt tour. Giao dịch được mã
                hóa và bảo vệ.
              </p>
            </div>
            <div className="breadcrumb-steps">
              <span className="step-past">Bước 1/2</span>
              <span className="step-current">Bước 2/2</span>
            </div>
          </div>

          <div className="checkout-main">
            {/* Left: Payment Methods */}
            <div className="payment-section">
              <h2>Phương thức thanh toán</h2>

              {/* Payment Options - NHẤN THẺ ĐỂ CHỌN */}
              <div className="payment-options">
                <div
                  className={`option ${
                    paymentMethod === "card" ? "active" : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <span className="icon">Thẻ tín dụng/ghi nợ</span>
                  <span className="tag">Mặc định</span>
                </div>

                <div
                  className={`option ${
                    paymentMethod === "digital" ? "active" : ""
                  }`}
                  onClick={() => setPaymentMethod("digital")}
                >
                  <span className="icon">
                    Ví điện tử (Apple Pay / Google Pay)
                  </span>
                  <span className="tag">Nhanh</span>
                </div>

                <div
                  className={`option ${
                    paymentMethod === "bank" ? "active" : ""
                  }`}
                  onClick={() => setPaymentMethod("bank")}
                >
                  <span className="icon">Chuyển khoản ngân hàng</span>
                  <span className="tag">24-48h</span>
                </div>
              </div>

              {/* Card Form */}
              {paymentMethod === "card" && (
                <div className="card-form">
                  <h3>Chi tiết thẻ</h3>

                  <div className="input-group">
                    <label>Số thẻ (1234 5678 9012 3456)</label>
                    <input type="text" placeholder="1234 5678 9012 3456" />
                  </div>

                  <div className="input-row">
                    <div className="input-group half">
                      <label>MM / YY</label>
                      <input type="text" placeholder="MM / YY" />
                    </div>
                    <div className="input-group half">
                      <label>CVV</label>
                      <input type="text" placeholder="CVV" />
                    </div>
                    <div className="input-group half">
                      <label>Tên in trên thẻ</label>
                      <input type="text" placeholder="Tên in trên thẻ" />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Địa chỉ thanh toán (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Địa chỉ thanh toán (tùy chọn)"
                    />
                  </div>

                  <div className="security-info">
                    <h3>Xác thực bảo mật</h3>
                    <div className="checkbox-item">
                      <input type="checkbox" id="3ds" />
                      <label htmlFor="3ds">
                        Chúng tôi có thể yêu cầu xác thực 3D Secure từ ngân hàng
                        của bạn.
                      </label>
                    </div>
                    <div className="checkbox-item">
                      <input type="checkbox" id="save" />
                      <label htmlFor="save">
                        Đồng ý lưu thẻ cho lần sau (tùy chọn)
                      </label>
                    </div>
                  </div>

                  <p className="terms">
                    Bằng cách tiếp tục, bạn đồng ý Điều khoản dịch vụ và Chính
                    sách bảo mật.
                  </p>
                </div>
              )}

              {/* Digital Wallet */}
              {paymentMethod === "digital" && (
                <div className="digital-wallet">
                  <p>Chọn ví điện tử để thanh toán nhanh.</p>
                  <div className="wallet-buttons">
                    <button className="wallet-btn apple">Apple Pay</button>
                    <button className="wallet-btn google">Google Pay</button>
                  </div>
                </div>
              )}

              {/* Bank Transfer */}
              {paymentMethod === "bank" && (
                <div className="bank-transfer">
                  <p>
                    Chuyển khoản đến tài khoản công ty. Hệ thống sẽ tự động xác
                    nhận trong 24-48h.
                  </p>
                  <div className="bank-info">
                    <p>
                      <strong>Ngân hàng:</strong> Vietcombank
                    </p>
                    <p>
                      <strong>STK:</strong> 0011001932418
                    </p>
                    <p>
                      <strong>Chủ TK:</strong> NGUYEN VAN A
                    </p>
                    <p>
                      <strong>Nội dung:</strong> <code>HALONG2025</code>
                    </p>
                  </div>
                  <div className="qr-code">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Vietcombank:0011001932418:NGUYEN VAN A:HALONG2025"
                      alt="QR Code"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Summary */}
            <div className="summary-section">
              <h3>Tóm tắt đơn hàng</h3>

              <div className="order-item">
                <img
                  src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                  alt="Vịnh Hạ Long"
                />
                <div className="order-info">
                  <h4>Vịnh Hạ Long 2N1Đ - Du thuyền 5*</h4>
                  <p>Quảng Ninh | 20/12/2025</p>
                </div>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Giá tour</span>
                  <span>6.600.000đ</span>
                </div>
                <div className="price-row">
                  <span>Mã giảm HALONG10</span>
                  <span className="discount">-420.000đ</span>
                </div>
                <div className="price-row">
                  <span>Phí xử lý</span>
                  <span>0đ</span>
                </div>
                <div className="price-total">
                  <span>Tổng thanh toán</span>
                  <span>6.180.000đ</span>
                </div>
              </div>

              <div className="invoice-section">
                <h4>Hóa đơn</h4>
                <div className="checkbox-item">
                  <input type="checkbox" id="invoice" />
                  <label htmlFor="invoice">
                    Xuất hóa đơn công ty (tùy chọn)
                  </label>
                </div>
              </div>

              <div className="security-badge">
                <span>Mã hóa AES-256 • PCI-DSS</span>
              </div>

              <div className="action-buttons">
                <button className="btn-back" onClick={() => navigate("/cart")}>
                  Quay lại
                </button>
                <button className="btn-pay">Thanh toán & hoàn tất</button>
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
