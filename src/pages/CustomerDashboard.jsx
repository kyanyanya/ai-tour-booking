// src/pages/CustomerDashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user || user.role !== "customer") {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />

      <div className="cd2-container">
        {/* Topbar */}
        <div className="cd2-topbar">
          <div className="cd2-topbar-left">
            <h1 className="cd2-title">Bảng điều khiển khách hàng</h1>
            <p className="cd2-subtitle">
              Theo dõi đặt tour, điểm thưởng, đánh giá và gợi ý AI cá nhân hóa
            </p>
          </div>
          <div className="cd2-topbar-right">
            <button
              className="cd2-btn-create"
              onClick={() => navigate("/tours")}
            >
              Tìm tour mới
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="cd2-tabs">
          <button
            className={`cd2-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Tổng quan
          </button>
          <button
            className={`cd2-tab ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            Lịch sử đặt tour
          </button>
          <button
            className={`cd2-tab ${activeTab === "points" ? "active" : ""}`}
            onClick={() => setActiveTab("points")}
          >
            Điểm thưởng
          </button>
          <button
            className={`cd2-tab ${activeTab === "vouchers" ? "active" : ""}`}
            onClick={() => setActiveTab("vouchers")}
          >
            Voucher
          </button>
          <button
            className={`cd2-tab ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá
          </button>
          <button
            className={`cd2-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Hồ sơ
          </button>
        </div>

        {/* Content */}
        <div className="cd2-content">
          {/* === TỔNG QUAN === */}
          {activeTab === "overview" && (
            <>
              <div className="cd2-stats-grid">
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon bookings">Tour</div>
                  <div className="cd2-stat-value">12</div>
                  <div className="cd2-stat-label">Tour đã đặt</div>
                  <div className="cd2-stat-change up">+3</div>
                </div>
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon points">Points</div>
                  <div className="cd2-stat-value">2,450</div>
                  <div className="cd2-stat-label">Điểm tích lũy</div>
                  <div className="cd2-stat-change up">+180</div>
                </div>
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon vouchers">Voucher</div>
                  <div className="cd2-stat-value">5</div>
                  <div className="cd2-stat-label">Voucher đang có</div>
                  <div className="cd2-stat-change">Mới</div>
                </div>
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon reviews">Review</div>
                  <div className="cd2-stat-value">8</div>
                  <div className="cd2-stat-label">Đánh giá đã gửi</div>
                  <div className="cd2-stat-change up">+2</div>
                </div>
              </div>

              <div className="cd2-ai-card">
                <div className="cd2-ai-header">
                  <div className="cd2-ai-icon">AI</div>
                  <h3>Gợi ý AI thông minh</h3>
                </div>
                <p>
                  <strong>“Sapa 3N2Đ – Trekking & Homestay”</strong> phù hợp với
                  bạn:
                  <strong>94%</strong> tương thích. Dùng{" "}
                  <strong>500 điểm</strong> → giảm <strong>250.000đ</strong>.
                </p>
                <button className="cd2-btn-apply">Xem chi tiết</button>
              </div>
            </>
          )}

          {/* === LỊCH SỬ ĐẶT TOUR === */}
          {activeTab === "bookings" && (
            <div className="cd2-table-wrapper">
              <div className="cd2-table-header">
                <h3>Lịch sử đặt tour</h3>
                <select className="cd2-period">
                  <option>Tất cả</option>
                  <option>Đang xử lý</option>
                  <option>Đã hoàn thành</option>
                  <option>Đã hủy</option>
                </select>
              </div>
              <table className="cd2-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Tour</th>
                    <th>Ngày đi</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#ORD-7742</td>
                    <td>
                      <div className="cd2-tour-cell">
                        <img
                          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&q=80"
                          alt="Hạ Long"
                          className="cd2-tour-img"
                        />
                        <div>
                          Vịnh Hạ Long 2N1Đ
                          <small>Du thuyền 5*</small>
                        </div>
                      </div>
                    </td>
                    <td>20/12/2025</td>
                    <td>6.180.000đ</td>
                    <td>
                      <span className="cd2-status confirmed">
                        Đã thanh toán
                      </span>
                    </td>
                    <td>
                      <button className="cd2-btn view">Xem</button>
                      <button className="cd2-btn review">Đánh giá</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === ĐIỂM THƯỞNG === */}
          {activeTab === "points" && (
            <div className="cd2-table-wrapper">
              <h3>Chi tiết điểm thưởng</h3>
              <div className="cd2-points-summary">
                <div className="cd2-points-total">
                  <strong>2,450</strong> điểm
                </div>
                <p>1 điểm = 1.000đ khi đổi voucher</p>
              </div>
              <table className="cd2-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Nội dung</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>15/11/2025</td>
                    <td>Đặt tour Hạ Long</td>
                    <td className="cd2-points-earned">+180</td>
                  </tr>
                  <tr>
                    <td>10/11/2025</td>
                    <td>Viết đánh giá</td>
                    <td className="cd2-points-earned">+50</td>
                  </tr>
                  <tr>
                    <td>05/11/2025</td>
                    <td>Đổi voucher</td>
                    <td className="cd2-points-spent">-300</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === VOUCHER === */}
          {activeTab === "vouchers" && (
            <div className="cd2-table-wrapper">
              <h3>Voucher đang sở hữu</h3>
              <div className="cd2-voucher-grid">
                <div className="cd2-voucher-card">
                  <div className="cd2-voucher-header">
                    <span className="cd2-voucher-discount">-300.000đ</span>
                  </div>
                  <h4>SAPA2025</h4>
                  <p>Áp dụng cho tour Sapa từ 2 người</p>
                  <p className="cd2-voucher-expiry">Hết hạn: 31/12/2025</p>
                  <button className="cd2-btn use">Dùng ngay</button>
                </div>
                <div className="cd2-voucher-card">
                  <div className="cd2-voucher-header">
                    <span className="cd2-voucher-discount">Miễn phí</span>
                  </div>
                  <h4>WELCOME100</h4>
                  <p>Giảm 100.000đ cho đơn đầu tiên</p>
                  <p className="cd2-voucher-expiry">Hết hạn: 30/11/2025</p>
                  <button className="cd2-btn use">Dùng ngay</button>
                </div>
              </div>
            </div>
          )}

          {/* === ĐÁNH GIÁ === */}
          {activeTab === "reviews" && (
            <div className="cd2-table-wrapper">
              <h3>Đánh giá của bạn</h3>
              <div className="cd2-review-item">
                <div>
                  <strong>Vịnh Hạ Long 2N1Đ</strong>
                  <p>
                    "Hướng dẫn viên nhiệt tình, cảnh đẹp, ăn uống tuyệt vời!"
                  </p>
                  <div className="cd2-rate good">5.0</div>
                </div>
                <button className="cd2-btn edit">Sửa</button>
              </div>
              <div className="cd2-review-item">
                <div>
                  <strong>Phú Quốc 3N2Đ</strong>
                  <p>"Bãi biển sạch, nhưng khách sạn hơi xa trung tâm."</p>
                  <div className="cd2-rate good">4.0</div>
                </div>
                <button className="cd2-btn edit">Sửa</button>
              </div>
            </div>
          )}

          {/* === HỒ SƠ === */}
          {activeTab === "profile" && (
            <div className="cd2-table-wrapper">
              <h3>Thông tin cá nhân</h3>
              <div className="cd2-profile-form">
                <div className="cd2-input-group">
                  <label>Họ và tên</label>
                  <input type="text" value={user.name || "Nguyễn Văn A"} />
                </div>
                <div className="cd2-input-group">
                  <label>Email</label>
                  <input type="email" value={user.email || "a@gmail.com"} />
                </div>
                <div className="cd2-input-group">
                  <label>Số điện thoại</label>
                  <input type="tel" value="0901234567" />
                </div>
                <div className="cd2-input-group">
                  <label>Địa chỉ</label>
                  <input type="text" placeholder="Hà Nội, Việt Nam" />
                </div>
                <button className="cd2-btn save">Lưu thay đổi</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CustomerDashboard;
