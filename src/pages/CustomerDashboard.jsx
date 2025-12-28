// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import ConfirmModal from "../components/modals/ConfirmModal";
import "../styles/pages/CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // Chỉ dùng displayBookings để hiển thị và thao tác xóa/hủy
  const [displayBookings, setDisplayBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // State cho modal hủy tour
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // State cho modal xóa tour đã hủy
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");
  const userId = user?.id;

  // Lấy điểm thưởng
  useEffect(() => {
    const fetchRewardPoints = async () => {
      if (!user || !accessToken || !userId) return;

      try {
        const { data } = await axios.get(
          `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
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
  }, [user, userId, accessToken, SUPABASE_URL, SUPABASE_ANON_KEY]);

  // Lấy voucher
  useEffect(() => {
    if (activeTab === "vouchers" && user && accessToken && userId) {
      const fetchMyVouchers = async () => {
        setLoadingVouchers(true);
        try {
          const { data } = await axios.get(
            `${SUPABASE_URL}/rest/v1/vouchers?claimed_by=cs.{${userId}}&select=*,tours(name,tour_code)&order=created_at.desc`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          setMyVouchers(data || []);
        } catch (err) {
          console.error("Lỗi lấy voucher:", err);
          toast.error("Không thể tải voucher của bạn.");
          setMyVouchers([]);
        } finally {
          setLoadingVouchers(false);
        }
      };

      fetchMyVouchers();
    }
  }, [activeTab, user, userId, accessToken, SUPABASE_URL, SUPABASE_ANON_KEY]);

  // Lấy lịch sử đặt tour
  useEffect(() => {
    if (activeTab === "bookings" && user && accessToken && userId) {
      const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
          const { data } = await axios.get(
            `${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${userId}&select=*,tours(name,image,location,duration_days)&order=created_at.desc`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          setDisplayBookings(data || []);
        } catch (err) {
          console.error("Lỗi lấy lịch sử đặt tour:", err);
          toast.error("Không thể tải lịch sử đặt tour.");
          setDisplayBookings([]);
        } finally {
          setLoadingBookings(false);
        }
      };

      fetchBookings();
    }
  }, [activeTab, user, userId, accessToken, SUPABASE_URL, SUPABASE_ANON_KEY]);

  if (!user || user.role !== "customer") {
    return <Navigate to="/login" replace />;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa xác định";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateEndDate = (bookingDate, durationDays) => {
    if (!bookingDate || !durationDays) return "Chưa xác định";
    const start = new Date(bookingDate);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);
    return formatDate(end);
  };

  const getPaymentStatus = (status) => {
    switch (status) {
      case "unpaid":
        return { text: "Chưa thanh toán", class: "pending" };
      case "paid":
        return { text: "Đã thanh toán", class: "confirmed" };
      default:
        return { text: status || "Chưa rõ", class: "pending" };
    }
  };

  const getOrderStatus = (status) => {
    switch (status) {
      case "pending":
        return { text: "Chờ xử lý", class: "pending" };
      case "confirmed":
        return { text: "Đã xác nhận", class: "confirmed" };
      case "completed":
        return { text: "Hoàn thành", class: "completed" };
      case "cancelled":
        return { text: "Đã hủy", class: "cancelled" };
      default:
        return { text: status || "Chưa rõ", class: "pending" };
    }
  };

  const canCancel = (booking) => {
    return (
      booking.payment_status === "unpaid" && booking.status !== "cancelled"
    );
  };

  const canDelete = (booking) => {
    return booking.status === "cancelled";
  };

  // Mở modal hủy tour
  const handleCancelBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  // Xác nhận hủy tour
  const confirmCancelBooking = async () => {
    if (!selectedBookingId) return;

    try {
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/bookings?id=eq.${selectedBookingId}`,
        { status: "cancelled" },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Đã hủy tour thành công!");
      setDisplayBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } catch (err) {
      console.error("Lỗi hủy tour:", err);
      toast.error("Không thể hủy tour. Vui lòng thử lại!");
    } finally {
      setShowCancelModal(false);
      setSelectedBookingId(null);
    }
  };

  // Mở modal xóa tour đã hủy
  const handleDeleteCancelledBooking = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa khỏi danh sách hiển thị
  const confirmDeleteBooking = () => {
    if (!bookingToDelete) return;

    setDisplayBookings((prev) =>
      prev.filter((b) => b.id !== bookingToDelete.id)
    );

    toast.success("Đã xóa tour đã hủy khỏi danh sách!");
    setShowDeleteModal(false);
    setBookingToDelete(null);
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
          {/* Tổng quan */}
          {activeTab === "overview" && (
            <>
              <div className="cd2-stats-grid">
                <div className="cd2-stat-card">
                  <div className="cd2-stat-icon bookings">Tour</div>
                  <div className="cd2-stat-value">{displayBookings.length}</div>
                  <div className="cd2-stat-label">Tour đã đặt</div>
                  <div className="cd2-stat-change up">Mới</div>
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
                  <div className="cd2-stat-value">0</div>
                  <div className="cd2-stat-label">Đánh giá đã gửi</div>
                  <div className="cd2-stat-change up">Chưa có</div>
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

          {/* Lịch sử đặt tour */}
          {activeTab === "bookings" && (
            <div className="cd2-table-wrapper">
              <div className="cd2-table-header">
                <h3>Lịch sử đặt tour</h3>
                <select className="cd2-period">
                  <option>Tất cả</option>
                  <option>Chưa thanh toán</option>
                  <option>Đã thanh toán</option>
                  <option>Đã hoàn thành</option>
                  <option>Đã hủy</option>
                </select>
              </div>

              {loadingBookings ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải lịch sử đặt tour...
                </div>
              ) : displayBookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#888",
                  }}
                >
                  <p>Bạn chưa đặt tour nào.</p>
                  <p>Hãy khám phá các tour hấp dẫn ngay!</p>
                  <button
                    className="cd2-btn-create"
                    onClick={() => navigate("/tours")}
                    style={{ marginTop: "16px" }}
                  >
                    Tìm tour mới
                  </button>
                </div>
              ) : (
                <table className="cd2-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Tour</th>
                      <th>Ngày đi - Ngày về</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái đơn</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBookings.map((booking) => {
                      const tour = booking.tours || {};
                      const paymentStatus = getPaymentStatus(
                        booking.payment_status
                      );
                      const orderStatus = getOrderStatus(booking.status);
                      const startDate = formatDate(booking.booking_date);
                      const endDate = calculateEndDate(
                        booking.booking_date,
                        tour.duration_days
                      );

                      return (
                        <tr key={booking.id}>
                          <td>#{booking.id.slice(0, 8).toUpperCase()}</td>
                          <td>
                            <div className="cd2-tour-cell">
                              <img
                                src={
                                  tour.image || "https://via.placeholder.com/48"
                                }
                                alt={tour.name}
                                className="cd2-tour-img"
                              />
                              <div>
                                {tour.name || "Tour không xác định"}
                                <small>{tour.location}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {startDate} → {endDate}
                            <br />
                            <small>{booking.number_of_people} người</small>
                          </td>
                          <td>{formatPrice(booking.total_price)}</td>
                          <td>
                            <span
                              className={`cd2-status ${paymentStatus.class}`}
                            >
                              {paymentStatus.text}
                            </span>
                          </td>
                          <td>
                            <span className={`cd2-status ${orderStatus.class}`}>
                              {orderStatus.text}
                            </span>
                          </td>
                          <td>
                            {canCancel(booking) ? (
                              <>
                                <button
                                  className="cd2-btn view"
                                  onClick={() =>
                                    navigate("/checkout/contact", {
                                      state: {
                                        bookingId: booking.id,
                                        tour: tour,
                                        numberOfPeople:
                                          booking.number_of_people,
                                        totalPrice: booking.total_price,
                                        bookingDate: booking.booking_date,
                                      },
                                    })
                                  }
                                >
                                  Thanh toán
                                </button>
                                <button
                                  className="cd2-btn cancel"
                                  onClick={() =>
                                    handleCancelBooking(booking.id)
                                  }
                                >
                                  Hủy tour
                                </button>
                              </>
                            ) : canDelete(booking) ? (
                              <button
                                className="cd2-btn delete"
                                onClick={() =>
                                  handleDeleteCancelledBooking(booking)
                                }
                              >
                                Xóa
                              </button>
                            ) : (
                              <span
                                style={{ color: "#999", fontSize: "0.85rem" }}
                              >
                                Không thể thao tác
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Điểm thưởng */}
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

          {/* Voucher */}
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
                    phí hoặc dùng điểm mua!
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

          {/* Đánh giá */}
          {activeTab === "reviews" && (
            <div className="cd2-table-wrapper">
              <h3>Đánh giá của bạn</h3>
              <p
                style={{ textAlign: "center", padding: "60px", color: "#888" }}
              >
                Chưa có đánh giá nào. Bạn sẽ có thể đánh giá sau khi hoàn thành
                tour.
              </p>
            </div>
          )}

          {/* Hồ sơ */}
          {activeTab === "profile" && (
            <div className="cd2-table-wrapper">
              <h3>Thông tin cá nhân</h3>
              <div className="cd2-profile-form">
                <div className="cd2-input-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={user.full_name || ""}
                    readOnly
                  />
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

      {/* Modal xác nhận hủy tour */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Xác nhận hủy tour"
        message="Bạn có chắc chắn muốn hủy tour này? Hành động này không thể hoàn tác."
        onConfirm={confirmCancelBooking}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Modal xác nhận xóa tour đã hủy */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa tour đã hủy"
        message="Bạn có muốn xóa tour này khỏi danh sách không? Tour vẫn tồn tại trong hệ thống nhưng sẽ không hiển thị nữa."
        onConfirm={confirmDeleteBooking}
        onCancel={() => setShowDeleteModal(false)}
      />

      <Footer />
    </>
  );
};

export default CustomerDashboard;
