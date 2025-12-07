// src/pages/PartnerDashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/PartnerDashboard.css";

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user || user.role !== "partner") {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />

      <div className="pd-container">
        {/* Topbar */}
        <div className="pd-topbar">
          <div className="pd-topbar-left">
            <h1 className="pd-title">Bảng điều khiển Đối tác</h1>
            <p className="pd-subtitle">
              Quản lý tours, đơn hàng và doanh thu của bạn
            </p>
          </div>
          <div className="pd-topbar-right">
            <select className="pd-period">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Năm nay</option>
            </select>
            <button className="pd-btn-create">+ Tạo tour mới</button>
          </div>
        </div>

        {/* Tabs - ĐÃ CẬP NHẬT THEO YÊU CẦU */}
        <div className="pd-tabs">
          <button
            className={`pd-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Tổng quan
          </button>
          <button
            className={`pd-tab ${activeTab === "tours" ? "active" : ""}`}
            onClick={() => setActiveTab("tours")}
          >
            Tour của bạn
          </button>
          <button
            className={`pd-tab ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng
          </button>
          <button
            className={`pd-tab ${activeTab === "recentBookings" ? "active" : ""}`}
            onClick={() => setActiveTab("recentBookings")}
          >
            Đặt chỗ gần đây
          </button>
          <button
            className={`pd-tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Phân tích
          </button>
          <button
            className={`pd-tab ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Thanh toán
          </button>
          <button
            className={`pd-tab ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá
          </button>
        </div>

        {/* Content */}
        <div className="pd-content">
          {/* === TỔNG QUAN === */}
          {activeTab === "overview" && (
            <>
              <div className="pd-stats-grid">
                <div className="pd-stat-card">
                  <div className="pd-stat-icon bookings">Bookings</div>
                  <div className="pd-stat-value">1,248</div>
                  <div className="pd-stat-label">Tổng đặt chỗ</div>
                  <div className="pd-stat-change up">+15%</div>
                </div>
                <div className="pd-stat-card">
                  <div className="pd-stat-icon revenue">Revenue</div>
                  <div className="pd-stat-value">2.8B</div>
                  <div className="pd-stat-label">Doanh thu</div>
                  <div className="pd-stat-change up">+12%</div>
                </div>
                <div className="pd-stat-card">
                  <div className="pd-stat-icon customers">Customers</div>
                  <div className="pd-stat-value">892</div>
                  <div className="pd-stat-label">Khách hàng</div>
                  <div className="pd-stat-change up">+8%</div>
                </div>
                <div className="pd-stat-card">
                  <div className="pd-stat-icon reviews">Reviews</div>
                  <div className="pd-stat-value">4.7</div>
                  <div className="pd-stat-label">Đánh giá TB</div>
                  <div className="pd-stat-change up">+0.2</div>
                </div>
              </div>

              <div className="pd-ai-card">
                <div className="pd-ai-header">
                  <div className="pd-ai-icon">AI</div>
                  <h3>Gợi ý từ AI</h3>
                </div>
                <p>
                  <strong>“Đà Lạt 3N2Đ”</strong> có lượt xem cao nhưng tỷ lệ chuyển đổi thấp.
                  Đề xuất: thêm <strong>hình ảnh thực tế</strong> + <strong>video trải nghiệm</strong>.
                </p>
                <button className="pd-btn-apply">Cập nhật ngay</button>
              </div>
            </>
          )}

          {/* === TOUR CỦA BẠN === */}
          {activeTab === "tours" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Danh sách Tour của bạn</h3>
                <button className="pd-btn-create">+ Thêm tour mới</button>
              </div>
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Tour</th>
                    <th>Lượt đặt</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="pd-tour-cell">Đà Lạt 3N2Đ - Thiên đường mộng mơ</div>
                    </td>
                    <td>156</td>
                    <td>1.850.000đ</td>
                    <td>
                      <span className="pd-status ongoing">Đang bán</span>
                    </td>
                    <td>
                      <button className="pd-btn edit">Sửa</button>
                      <button className="pd-btn stop">Tạm dừng</button>
                      <button className="pd-btn view">Xem</button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="pd-tour-cell">Phú Quốc 4N3Đ - Biển xanh cát trắng</div>
                    </td>
                    <td>89</td>
                    <td>3.200.000đ</td>
                    <td>
                      <span className="pd-status ongoing">Đang bán</span>
                    </td>
                    <td>
                      <button className="pd-btn edit">Sửa</button>
                      <button className="pd-btn stop">Tạm dừng</button>
                      <button className="pd-btn view">Xem</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === ĐƠN HÀNG === */}
          {activeTab === "orders" && (
            <div className="pd-orders-container">
              {/* Bảng 1: Các Tour chờ xử lý */}
              <div className="pd-table-wrapper">
                <div className="pd-table-header">
                  <h3>Các Tour chờ xử lý</h3>
                  <div className="pd-table-actions">
                    <input
                      type="text"
                      placeholder="Tìm kiếm đơn hàng..."
                      className="pd-search"
                    />
                    <span className="pd-badge pending">5 đơn chờ xử lý</span>
                  </div>
                </div>

                <table className="pd-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Tour</th>
                      <th>Khách hàng</th>
                      <th>Ngày đi</th>
                      <th>Số khách</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#ORD-8844</td>
                      <td>Phú Quốc 4N3Đ - Biển xanh cát trắng</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Lê Văn C</strong>
                          <small>lec@email.com</small>
                        </div>
                      </td>
                      <td>20/12/2024</td>
                      <td>4 người</td>
                      <td>6.400.000đ</td>
                      <td>
                        <span className="pd-status pending">Chờ xác nhận</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn confirm">Xác nhận</button>
                          <button className="pd-btn reject">Từ chối</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>#ORD-8843</td>
                      <td>Đà Lạt 3N2Đ - Thiên đường mộng mơ</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Nguyễn Thị D</strong>
                          <small>nguyenthid@email.com</small>
                        </div>
                      </td>
                      <td>18/12/2024</td>
                      <td>2 người</td>
                      <td>3.700.000đ</td>
                      <td>
                        <span className="pd-status pending">Chờ xác nhận</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn confirm">Xác nhận</button>
                          <button className="pd-btn reject">Từ chối</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>#ORD-8842</td>
                      <td>Hà Giang 3N2Đ - Cao nguyên đá</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Trần Văn E</strong>
                          <small>tranvane@email.com</small>
                        </div>
                      </td>
                      <td>22/12/2024</td>
                      <td>3 người</td>
                      <td>5.250.000đ</td>
                      <td>
                        <span className="pd-status pending">Chờ xác nhận</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn confirm">Xác nhận</button>
                          <button className="pd-btn reject">Từ chối</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Phân trang cho bảng chờ xử lý */}
                <div className="pd-pagination">
                  <button className="pd-pagination-btn disabled">← Trước</button>
                  <button className="pd-pagination-btn active">1</button>
                  <button className="pd-pagination-btn">2</button>
                  <button className="pd-pagination-btn">3</button>
                  <span className="pd-pagination-ellipsis">...</span>
                  <button className="pd-pagination-btn">5</button>
                  <button className="pd-pagination-btn">Tiếp →</button>
                </div>

                <div className="pd-view-all">
                  <button className="pd-btn view-all">Xem tất cả đơn chờ xử lý</button>
                </div>
              </div>

              {/* Bảng 2: Các Tour đã xử lý */}
              <div className="pd-table-wrapper">
                <div className="pd-table-header">
                  <h3>Các Tour đã xử lý</h3>
                  <div className="pd-table-actions">
                    <input
                      type="text"
                      placeholder="Tìm kiếm đơn hàng..."
                      className="pd-search"
                    />
                    <span className="pd-badge confirmed">12 đơn đã xử lý</span>
                  </div>
                </div>

                <table className="pd-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Tour</th>
                      <th>Khách hàng</th>
                      <th>Ngày đi</th>
                      <th>Số khách</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#ORD-8841</td>
                      <td>Đà Lạt 3N2Đ - Thiên đường mộng mơ</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Phạm Thị F</strong>
                          <small>phamthif@email.com</small>
                        </div>
                      </td>
                      <td>15/12/2024</td>
                      <td>2 người</td>
                      <td>3.700.000đ</td>
                      <td>
                        <span className="pd-status confirmed">Đã xác nhận</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn contact">Liên hệ</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>#ORD-8840</td>
                      <td>Phú Quốc 4N3Đ - Biển xanh cát trắng</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Hoàng Văn G</strong>
                          <small>hoangvang@email.com</small>
                        </div>
                      </td>
                      <td>12/12/2024</td>
                      <td>4 người</td>
                      <td>6.400.000đ</td>
                      <td>
                        <span className="pd-status confirmed">Đã xác nhận</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn contact">Liên hệ</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>#ORD-8839</td>
                      <td>Hạ Long 2N1Đ - Vịnh di sản</td>
                      <td>
                        <div className="pd-customer-info">
                          <strong>Lý Thị H</strong>
                          <small>lythih@email.com</small>
                        </div>
                      </td>
                      <td>10/12/2024</td>
                      <td>3 người</td>
                      <td>4.200.000đ</td>
                      <td>
                        <span className="pd-status cancelled">Đã hủy</span>
                      </td>
                      <td>
                        <div className="pd-action-buttons">
                          <button className="pd-btn contact">Liên hệ</button>
                          <button className="pd-btn view">Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Phân trang cho bảng đã xử lý */}
                <div className="pd-pagination">
                  <button className="pd-pagination-btn disabled">← Trước</button>
                  <button className="pd-pagination-btn active">1</button>
                  <button className="pd-pagination-btn">2</button>
                  <button className="pd-pagination-btn">3</button>
                  <span className="pd-pagination-ellipsis">...</span>
                  <button className="pd-pagination-btn">8</button>
                  <button className="pd-pagination-btn">Tiếp →</button>
                </div>

                <div className="pd-view-all">
                  <button className="pd-btn view-all">Xem tất cả đơn đã xử lý</button>
                </div>
              </div>
            </div>
          )}

          {/* === ĐẶT CHỖ GẦN ĐÂY === */}
          {activeTab === "recentBookings" && (
            <div className="pd-table-wrapper">
              <h3>Đặt chỗ gần đây</h3>
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Mã đặt chỗ</th>
                    <th>Tour</th>
                    <th>Khách hàng</th>
                    <th>Thời gian đặt</th>
                    <th>Số khách</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#BK-9921</td>
                    <td>Đà Lạt 3N2Đ</td>
                    <td>Nguyễn Văn D</td>
                    <td>10/12/2024 14:30</td>
                    <td>2 người</td>
                    <td>
                      <span className="pd-status confirmed">Thành công</span>
                    </td>
                  </tr>
                  <tr>
                    <td>#BK-9920</td>
                    <td>Phú Quốc 4N3Đ</td>
                    <td>Phạm Thị E</td>
                    <td>10/12/2024 11:15</td>
                    <td>4 người</td>
                    <td>
                      <span className="pd-status pending">Đang xử lý</span>
                    </td>
                  </tr>
                  <tr>
                    <td>#BK-9919</td>
                    <td>Đà Lạt 3N2Đ</td>
                    <td>Hoàng Văn F</td>
                    <td>09/12/2024 16:45</td>
                    <td>3 người</td>
                    <td>
                      <span className="pd-status confirmed">Thành công</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* === PHÂN TÍCH === */}
          {activeTab === "analytics" && (
            <div className="pd-table-wrapper">
              <h3>Phân tích hiệu suất</h3>
              <div className="pd-analytics-grid">
                <div className="pd-analytics-card">
                  <h4>Lượt xem tour</h4>
                  <div className="pd-analytics-value">2,847</div>
                  <div className="pd-analytics-change up">+18%</div>
                </div>
                <div className="pd-analytics-card">
                  <h4>Tỷ lệ chuyển đổi</h4>
                  <div className="pd-analytics-value">5.2%</div>
                  <div className="pd-analytics-change up">+1.1%</div>
                </div>
                <div className="pd-analytics-card">
                  <h4>Thời gian xem TB</h4>
                  <div className="pd-analytics-value">2m 15s</div>
                  <div className="pd-analytics-change down">-12s</div>
                </div>
                <div className="pd-analytics-card">
                  <h4>Tour phổ biến</h4>
                  <div className="pd-analytics-value">Đà Lạt 3N2Đ</div>
                  <div className="pd-analytics-change">45% lượt xem</div>
                </div>
              </div>

              <div className="pd-chart-placeholder">
                <h4>Biểu đồ doanh thu 30 ngày qua</h4>
                <div className="pd-chart">
                  [Biểu đồ doanh thu sẽ được hiển thị ở đây]
                </div>
              </div>
            </div>
          )}

          {/* === THANH TOÁN === */}
          {activeTab === "payments" && (
            <div className="pd-table-wrapper">
              <h3>Lịch sử thanh toán</h3>
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Mã thanh toán</th>
                    <th>Kỳ thanh toán</th>
                    <th>Doanh thu</th>
                    <th>Phí dịch vụ</th>
                    <th>Thực nhận</th>
                    <th>Ngày chuyển</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#PAY-7741</td>
                    <td>Tháng 11/2024</td>
                    <td>1.2B</td>
                    <td>120M</td>
                    <td>1.08B</td>
                    <td>05/12/2024</td>
                    <td>
                      <span className="pd-status confirmed">Đã chuyển</span>
                    </td>
                  </tr>
                  <tr>
                    <td>#PAY-7740</td>
                    <td>Tháng 10/2024</td>
                    <td>980M</td>
                    <td>98M</td>
                    <td>882M</td>
                    <td>05/11/2024</td>
                    <td>
                      <span className="pd-status confirmed">Đã chuyển</span>
                    </td>
                  </tr>
                  <tr>
                    <td>#PAY-7739</td>
                    <td>Tháng 09/2024</td>
                    <td>1.5B</td>
                    <td>150M</td>
                    <td>1.35B</td>
                    <td>05/10/2024</td>
                    <td>
                      <span className="pd-status confirmed">Đã chuyển</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pd-payment-summary">
                <h4>Tổng kết thanh toán</h4>
                <div className="pd-summary-grid">
                  <div className="pd-summary-item">
                    <span>Doanh thu tháng này:</span>
                    <strong>1.8B</strong>
                  </div>
                  <div className="pd-summary-item">
                    <span>Dự kiến thực nhận:</span>
                    <strong>1.62B</strong>
                  </div>
                  <div className="pd-summary-item">
                    <span>Ngày chuyển dự kiến:</span>
                    <strong>05/01/2025</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === ĐÁNH GIÁ === */}
          {activeTab === "reviews" && (
            <div className="pd-table-wrapper">
              <h3>Đánh giá từ khách hàng</h3>
              <div className="pd-review-list">
                <div className="pd-review-item">
                  <div className="pd-review-header">
                    <strong>Nguyễn Thị H</strong>
                    <span className="pd-rating">★★★★★</span>
                    <span className="pd-review-date">08/12/2024</span>
                  </div>
                  <p>"Tour Đà Lạt tuyệt vời! Hướng dẫn viên nhiệt tình, khách sạn đẹp. Sẽ quay lại!"</p>
                  <div className="pd-review-tour">Đà Lạt 3N2Đ</div>
                </div>
                <div className="pd-review-item">
                  <div className="pd-review-header">
                    <strong>Trần Văn K</strong>
                    <span className="pd-rating">★★★★☆</span>
                    <span className="pd-review-date">07/12/2024</span>
                  </div>
                  <p>"Phú Quốc đẹp nhưng ăn uống chưa được đa dạng. Overall tốt!"</p>
                  <div className="pd-review-tour">Phú Quốc 4N3Đ</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default PartnerDashboard;