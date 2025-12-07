// src/pages/ContactInfo.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/ContactInfo.css";

const ContactInfo = () => {
  const navigate = useNavigate();

  // SỬA: Dùng setPassengerCount để thay đổi giá trị khi nhấn (demo)
  const [passengerCount, setPassengerCount] = useState("2 người lớn, 0 trẻ em");

  const handlePassengerClick = () => {
    // Demo: Thay đổi giá trị khi nhấn vào ô
    setPassengerCount("3 người lớn, 1 trẻ em");
  };

  return (
    <>
      <Header />

      <div className="ci-container">
        <div className="ci-wrapper">
          {/* Breadcrumb */}
          <div className="ci-breadcrumb">
            <div className="ci-breadcrumb-left">
              <h1>Thanh toán • Bước 1: Thông tin liên hệ</h1>
              <p>
                Điền thông tin hành khách và yêu cầu đặc biệt. Bước tiếp theo:
                nhập thông tin thanh toán.
              </p>
            </div>
            <div className="ci-breadcrumb-steps">
              <span className="ci-step-current">Bước 1/2</span>
              <span className="ci-step-next">Bước 2/2</span>
            </div>
          </div>

          <div className="ci-main">
            {/* Left: Form */}
            <div className="ci-form-section">
              {/* Thông tin người đặt */}
              <div className="ci-section">
                <h3>Thông tin người đặt</h3>
                <div className="ci-input-row">
                  <div className="ci-input-group">
                    <label>Họ và tên</label>
                    <input type="text" placeholder="Họ và tên" />
                  </div>
                  <div className="ci-input-group">
                    <label>Email</label>
                    <input type="email" placeholder="Email" />
                  </div>
                </div>
                <div className="ci-input-row">
                  <div className="ci-input-group">
                    <label>Số điện thoại</label>
                    <input type="tel" placeholder="Số điện thoại" />
                  </div>
                  <div className="ci-input-group">
                    <label>Quốc gia/Khu vực</label>
                    <input type="text" placeholder="Quốc gia/Khu vực" />
                  </div>
                </div>
              </div>

              {/* Hành khách */}
              <div className="ci-section">
                <h3>Hành khách</h3>
                <div className="ci-input-group full">
                  <label>Số lượng hành khách</label>
                  <div
                    className="ci-passenger-select"
                    onClick={handlePassengerClick}
                  >
                    <input
                      type="text"
                      value={passengerCount}
                      readOnly
                      placeholder="Chọn số lượng"
                    />
                    <span className="ci-dropdown-icon"></span>
                  </div>
                </div>
                <div className="ci-input-row">
                  <div className="ci-input-group">
                    <label>Hành khách 1 - Họ tên</label>
                    <input type="text" placeholder="Hành khách 1 - Họ tên" />
                  </div>
                  <div className="ci-input-group">
                    <label>Hành khách 2 - Họ tên</label>
                    <input type="text" placeholder="Hành khách 2 - Họ tên" />
                  </div>
                </div>
              </div>

              {/* Yêu cầu đặc biệt */}
              <div className="ci-section">
                <h3>Yêu cầu đặc biệt</h3>
                <div className="ci-input-group full">
                  <label>
                    Ghi chú cho nhà cung cấp (dị ứng, kỷ niệm, v.v.)
                  </label>
                  <textarea rows="3" placeholder="Nhập ghi chú..."></textarea>
                </div>
                <div className="ci-input-group full">
                  <label>Giờ đón mong muốn</label>
                  <input type="text" placeholder="Giờ đón mong muốn" />
                </div>
              </div>

              {/* Chính sách & Xác nhận */}
              <div className="ci-section">
                <h3>Chính sách & xác nhận</h3>
                <div className="ci-checkbox-item">
                  <input type="checkbox" id="terms" />
                  <label htmlFor="terms">
                    Tôi đồng ý với Điều khoản & Chính sách hủy
                  </label>
                </div>
                <p className="ci-note">
                  Thanh toán ở bước tiếp theo. Bạn có thể xem lại trước khi xác
                  nhận.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="ci-actions">
                <button
                  className="ci-btn-back"
                  onClick={() => navigate("/cart")}
                >
                  Quay lại
                </button>
                <button
                  className="ci-btn-next"
                  onClick={() => navigate("/checkout")}
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="ci-summary-section">
              <h3>Tóm tắt đơn hàng</h3>

              <div className="ci-order-item">
                <img
                  src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                  alt="Vịnh Hạ Long"
                />
                <div className="ci-order-info">
                  <h4>Vịnh Hạ Long 2N1Đ - Du thuyền 5*</h4>
                  <p>Quảng Ninh | 20/12/2025</p>
                </div>
              </div>

              <div className="ci-price-breakdown">
                <div className="ci-price-row">
                  <span>Giá tour</span>
                  <span>6.600.000đ</span>
                </div>
                <div className="ci-price-row">
                  <span>Mã giảm HALONG10</span>
                  <span className="ci-discount">-420.000đ</span>
                </div>
                <div className="ci-price-row">
                  <span>Phí xử lý</span>
                  <span>0đ</span>
                </div>
                <div className="ci-price-total">
                  <span>Tổng tạm tính</span>
                  <span>6.180.000đ</span>
                </div>
              </div>

              <div className="ci-addon">
                <h4>Tiện ích bổ sung</h4>
                <div className="ci-ai-suggestion">
                  <strong>Gợi ý thông minh</strong>
                  <p>
                    Thêm đưa đón sân bay + bữa trưa hải sản (249.000đ) cho nhóm
                    2 người.
                  </p>
                  <button className="ci-btn-add">+ Thêm vào đơn</button>
                </div>
              </div>

              <div className="ci-security-badge">
                <span>PCI-DSS ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ContactInfo;
