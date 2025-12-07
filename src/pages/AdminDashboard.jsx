// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />

      <div className="ad2-container">
        {/* Topbar */}
        <div className="ad2-topbar">
          <div className="ad2-topbar-left">
            <h1 className="ad2-title">Bảng điều khiển Admin</h1>
            <p className="ad2-subtitle">
              Quản lý toàn diện: người dùng, tour, đơn hàng, doanh thu
            </p>
          </div>
          <div className="ad2-topbar-right">
            <select className="ad2-period">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Năm nay</option>
            </select>
            <button className="ad2-btn-create">+ Tạo tour</button>
          </div>
        </div>

        {/* Tabs - ĐÃ BỔ SUNG 5 TAB */}
        <div className="ad2-tabs">
          <button
            className={`ad2-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Tổng quan
          </button>
          <button
            className={`ad2-tab ${activeTab === "tours" ? "active" : ""}`}
            onClick={() => setActiveTab("tours")}
          >
            Quản lý Tours
          </button>
          <button
            className={`ad2-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng
          </button>
          <button
            className={`ad2-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Người dùng
          </button>
          <button
            className={`ad2-tab ${activeTab === "partners" ? "active" : ""}`}
            onClick={() => setActiveTab("partners")}
          >
            Đối tác
          </button>
          <button
            className={`ad2-tab ${activeTab === "vouchers" ? "active" : ""}`}
            onClick={() => setActiveTab("vouchers")}
          >
            Voucher & KM
          </button>
          <button
            className={`ad2-tab ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá
          </button>
        </div>

        {/* Content */}
        <div className="ad2-content">
          {/* === TỔNG QUAN === */}
          {activeTab === "overview" && (
            <>
              <div className="ad2-stats-grid">
                <div className="ad2-stat-card">
                  <div className="ad2-stat-icon bookings">Bookings</div>
                  <div className="ad2-stat-value">8,420</div>
                  <div className="ad2-stat-label">Tổng đặt chỗ</div>
                  <div className="ad2-stat-change up">+12%</div>
                </div>
                <div className="ad2-stat-card">
                  <div className="ad2-stat-icon revenue">Revenue</div>
                  <div className="ad2-stat-value">12.4B</div>
                  <div className="ad2-stat-label">Doanh thu</div>
                  <div className="ad2-stat-change up">+8%</div>
                </div>
                <div className="ad2-stat-card">
                  <div className="ad2-stat-icon partners">Partners</div>
                  <div className="ad2-stat-value">312</div>
                  <div className="ad2-stat-label">Đối tác</div>
                  <div className="ad2-stat-change down">-2%</div>
                </div>
                <div className="ad2-stat-card">
                  <div className="ad2-stat-icon reviews">Reviews</div>
                  <div className="ad2-stat-value">4.8</div>
                  <div className="ad2-stat-label">Đánh giá TB</div>
                  <div className="ad2-stat-change up">+0.3</div>
                </div>
              </div>

              <div className="ad2-ai-card">
                <div className="ad2-ai-header">
                  <div className="ad2-ai-icon">AI</div>
                  <h3>Gợi ý từ AI</h3>
                </div>
                <p>
                  <strong>“Vịnh Hạ Long 2N1Đ”</strong> đang có tỷ lệ chuyển đổi
                  thấp. Đề xuất: giảm <strong>5%</strong> + huy hiệu “Bán chạy”.
                </p>
                <button className="ad2-btn-apply">Áp dụng ngay</button>
              </div>
            </>
          )}

          {/* === QUẢN LÝ TOURS === */}
          {activeTab === "tours" && (
            <div className="ad2-table-wrapper">
              <div className="ad2-table-header">
                <h3>Danh sách Tours</h3>
                <button className="ad2-btn-create">+ Thêm tour mới</button>
              </div>
              <table className="ad2-table">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Đối tác</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="ad2-tour-cell">Vịnh Hạ Long 2N1Đ</div>
                    </td>
                    <td>Ocean Queen</td>
                    <td>2.100.000đ</td>
                    <td>
                      <span className="ad2-status ongoing">Đang bán</span>
                    </td>
                    <td>
                      <button className="ad2-btn edit">Sửa</button>
                      <button className="ad2-btn stop">Tắt</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === ĐƠN HÀNG === */}
          {activeTab === "orders" && (
            <div className="ad2-table-wrapper">
              <h3>Đơn đặt tour</h3>
              <table className="ad2-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Tour</th>
                    <th>Khách</th>
                    <th>Tổng</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#ORD-7742</td>
                    <td>Vịnh Hạ Long</td>
                    <td>Nguyễn Văn A</td>
                    <td>4.380.000đ</td>
                    <td>
                      <span className="ad2-status confirmed">
                        Đã thanh toán
                      </span>
                    </td>
                    <td>
                      <button className="ad2-btn confirm">Xác nhận</button>
                      <button className="ad2-btn refund">Hoàn tiền</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === NGƯỜI DÙNG === */}
          {activeTab === "users" && (
            <div className="ad2-table-wrapper">
              <h3>Quản lý người dùng</h3>
              <table className="ad2-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Điểm</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Nguyễn Văn A</td>
                    <td>a@gmail.com</td>
                    <td>customer</td>
                    <td>1,250</td>
                    <td>
                      <button className="ad2-btn lock">Khóa</button>
                      <button className="ad2-btn edit">Sửa</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === ĐỐI TÁC === */}
          {activeTab === "partners" && (
            <div className="ad2-table-wrapper">
              <h3>Quản lý đối tác</h3>
              <table className="ad2-table">
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Số tour</th>
                    <th>Doanh thu</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ocean Queen</td>
                    <td>48</td>
                    <td>2.1B</td>
                    <td>
                      <span className="ad2-status confirmed">Đã duyệt</span>
                    </td>
                    <td>
                      <button className="ad2-btn approve">Duyệt</button>
                      <button className="ad2-btn reject">Từ chối</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === VOUCHER & KHUYẾN MÃI === */}
          {activeTab === "vouchers" && (
            <div className="ad2-table-wrapper">
              <div className="ad2-table-header">
                <h3>Chương trình khuyến mãi</h3>
                <button className="ad2-btn-create">+ Tạo flash sale</button>
              </div>
              <div className="ad2-promo-card">
                <h4>Flash Sale 11.11</h4>
                <p>
                  Giảm <strong>20%</strong> cho tour nội địa
                </p>
                <p>Hạn: 11/11 - 13/11</p>
                <button className="ad2-btn stop">Dừng</button>
              </div>
            </div>
          )}

          {/* === ĐÁNH GIÁ === */}
          {activeTab === "reviews" && (
            <div className="ad2-table-wrapper">
              <h3>Review cần duyệt</h3>
              <div className="ad2-review-item">
                <p>
                  <strong>#BKO-9211</strong> - "Tour tuyệt vời, hướng dẫn viên
                  nhiệt tình!"
                </p>
                <button className="ad2-btn approve">Duyệt</button>
                <button className="ad2-btn reject">Xóa</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AdminDashboard;
