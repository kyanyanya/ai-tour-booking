// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import "../styles/pages/CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");

  // Lấy điểm thưởng
  useEffect(() => {
    const fetchRewardPoints = async () => {
      if (!user || !accessToken) return;

      try {
        const { data } = await axios.get(
          `${SUPABASE_URL}/rest/v1/users?user_id=eq.${user.id}&select=reward_points`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (data && data.length > 0) {
          setRewardPoints(data[0].reward_points || 0);
        }
      } catch (err) {
        console.error("Lỗi lấy điểm thưởng:", err);
      } finally {
        setLoadingPoints(false);
      }
    };

    fetchRewardPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  // Lấy voucher khi vào tab Voucher
  useEffect(() => {
    if (activeTab === "vouchers" && user && accessToken) {
      const fetchMyVouchers = async () => {
        setLoadingVouchers(true);
        try {
          // Bước 1: Lấy danh sách mã voucher từ users.voucher_codes
          const { data: userData } = await axios.get(
            `${SUPABASE_URL}/rest/v1/users?user_id=eq.${user.id}&select=voucher_codes`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const voucherCodes = userData[0]?.voucher_codes || [];

          if (voucherCodes.length === 0) {
            setMyVouchers([]);
            setLoadingVouchers(false);
            return;
          }

          // Bước 2: Lấy chi tiết voucher theo các mã
          const codesQuery = voucherCodes
            .map((code) => `code=eq.${code}`)
            .join("&");
          const { data: voucherData } = await axios.get(
            `${SUPABASE_URL}/rest/v1/vouchers?${codesQuery}&select=*,tours(name,tour_code)&order=created_at.desc`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          setMyVouchers(voucherData || []);
        } catch (err) {
          console.error("Lỗi lấy voucher của khách:", err);
          toast.error("Không thể tải voucher của bạn.");
          setMyVouchers([]);
        } finally {
          setLoadingVouchers(false);
        }
      };

      fetchMyVouchers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, accessToken]);

  if (!user || user.role !== "customer") {
    return <Navigate to="/login" replace />;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return "Không giới hạn";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <Header />

      <div className="cd2-container">
        {/* Topbar */}
        <div className="cd2-topbar">
          <div className="cd2-topbar-left">
            <h1 className="cd2-title">Bảng điều khiển khách hàng</h1>
            <p className="cd2-subtitle">
              Theo dõi đặt tour, điểm thưởng, voucher và gợi ý AI cá nhân hóa
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
                  <div className="cd2-stat-value">
                    {loadingPoints ? "..." : rewardPoints.toLocaleString()}
                  </div>
                  <div className="cd2-stat-label">Điểm tích lũy</div>
                  <div className="cd2-stat-change up">Mới nhận</div>
                </div>
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon vouchers">Voucher</div>
                  <div className="cd2-stat-value">{myVouchers.length}</div>
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
                  bạn: <strong>94%</strong> tương thích.
                  <br />
                  Dùng <strong>500 điểm</strong> → giảm{" "}
                  <strong>350.000đ</strong> (1 điểm = 700đ).
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
                  <strong>{rewardPoints.toLocaleString()}</strong> điểm
                </div>
                <p>
                  1 điểm = 700đ khi trừ trực tiếp vào tour • Hoặc đổi voucher
                  giảm giá
                </p>
              </div>
              <p
                style={{
                  textAlign: "center",
                  color: "#666",
                  marginTop: "40px",
                }}
              >
                Lịch sử giao dịch điểm thưởng sẽ được cập nhật trong phiên bản
                tiếp theo.
              </p>
            </div>
          )}

          {/* === VOUCHER === */}
          {activeTab === "vouchers" && (
            <div className="cd2-table-wrapper">
              <h3>Voucher đang sở hữu ({myVouchers.length})</h3>

              {loadingVouchers ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải voucher...
                </div>
              ) : myVouchers.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#888",
                  }}
                >
                  <p>Bạn chưa sở hữu voucher nào.</p>
                  <p>
                    Hãy truy cập <strong>/vouchers</strong> để nhận voucher miễn
                    phí!
                  </p>
                </div>
              ) : (
                <div className="cd2-voucher-grid">
                  {myVouchers.map((voucher) => (
                    <div key={voucher.id} className="cd2-voucher-card">
                      <div className="cd2-voucher-header">
                        <span className="cd2-voucher-discount">
                          -{formatPrice(voucher.discount_amount)}
                        </span>
                      </div>
                      <h4>{voucher.code}</h4>
                      <p>
                        <strong>Áp dụng:</strong>{" "}
                        {voucher.tour_id
                          ? voucher.tours?.tour_code
                            ? `[${voucher.tours.tour_code}] ${voucher.tours.name}`
                            : voucher.tours?.name || "Tour cụ thể"
                          : "Tất cả các tour"}
                      </p>
                      <p>
                        <strong>Hết hạn:</strong>{" "}
                        {formatDate(voucher.expires_at)}
                      </p>
                      <button
                        className="cd2-btn use"
                        onClick={() => {
                          navigator.clipboard.writeText(voucher.code);
                          toast.success(`Đã copy mã: ${voucher.code}`);
                        }}
                      >
                        Copy mã
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                  <input type="text" defaultValue={user.full_name || ""} />
                </div>
                <div className="cd2-input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    defaultValue={user.email || ""}
                    readOnly
                  />
                </div>
                <div className="cd2-input-group">
                  <label>Số điện thoại</label>
                  <input type="tel" placeholder="Chưa cập nhật" />
                </div>
                <div className="cd2-input-group">
                  <label>Địa chỉ</label>
                  <input type="text" placeholder="Chưa cập nhật" />
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
