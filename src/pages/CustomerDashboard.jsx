/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import ConfirmModal from "../components/modals/ConfirmModal";
import RatingModal from "../components/modals/RatingModal";
import "../styles/pages/CustomerDashboard.css";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Tổng quan
  const [totalBookings, setTotalBookings] = useState(0);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [totalVouchers, setTotalVouchers] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Các tab khác
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [displayBookings, setDisplayBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  // Hồ sơ
  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
    address: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");
  const userId = user?.id;

  // === FETCH TỔNG QUAN ===
  const fetchOverviewData = async () => {
    if (!userId || !accessToken) return;
    setLoadingOverview(true);
    try {
      // 1. Số tour đã đặt
      const { data: bookingsData } = await axios.get(
        `${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${userId}&select=id`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setTotalBookings(bookingsData?.length || 0);

      // 2. Điểm thưởng
      const { data: userData } = await axios.get(
        `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setRewardPoints(userData?.[0]?.reward_points || 0);

      // 3. Số voucher đang sở hữu (claimed_by chứa userId)
      const { data: voucherData } = await axios.get(
        `${SUPABASE_URL}/rest/v1/vouchers?claimed_by=cs.{${userId}}&select=id`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setTotalVouchers(voucherData?.length || 0);

      // 4. Số đánh giá đã gửi
      const { data: reviewData } = await axios.get(
        `${SUPABASE_URL}/rest/v1/reviews?user_id=eq.${userId}&select=id`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setTotalReviews(reviewData?.length || 0);
    } catch (err) {
      console.error("Lỗi tải dữ liệu tổng quan:", err);
      toast.error("Không thể tải dữ liệu tổng quan.");
    } finally {
      setLoadingOverview(false);
    }
  };

  // === FETCH HỒ SƠ ===
  const fetchProfile = async () => {
    if (!userId || !accessToken) return;
    setLoadingProfile(true);
    try {
      const { data } = await axios.get(
        `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=full_name,phone_number,address`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (data && data.length > 0) {
        setProfile({
          full_name: data[0].full_name || "",
          phone_number: data[0].phone_number || "",
          address: data[0].address || "",
        });
      }
    } catch (err) {
      console.error("Lỗi tải hồ sơ:", err);
      toast.error("Không thể tải thông tin cá nhân.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // === LƯU HỒ SƠ ===
  const handleSaveProfile = async () => {
    if (!userId || !accessToken) return;
    setSavingProfile(true);
    try {
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`,
        profile,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      toast.error("Không thể lưu thông tin. Vui lòng thử lại!");
    } finally {
      setSavingProfile(false);
    }
  };

  // === FETCH MY REVIEWS ===
  const fetchMyReviews = async () => {
    if (!userId || !accessToken) return;
    setLoadingReviews(true);
    try {
      const { data } = await axios.get(
        `${SUPABASE_URL}/rest/v1/reviews?user_id=eq.${userId}&select=*,tours(id,name,image,location)&order=created_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setMyReviews(data || []);
    } catch (err) {
      console.error("Lỗi lấy đánh giá:", err);
      setMyReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load dữ liệu khi chuyển tab
  useEffect(() => {
    if (activeTab === "overview") fetchOverviewData();
    if (activeTab === "profile") fetchProfile();

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
          setMyVouchers([]);
        } finally {
          setLoadingVouchers(false);
        }
      };
      fetchMyVouchers();
    }

    if (activeTab === "bookings" && user && accessToken && userId) {
      const fetchBookings = async () => {
        setLoadingBookings(true);
        try {
          const { data } = await axios.get(
            `${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${userId}&select=*,tours(id,name,image,location,duration_days)&order=created_at.desc`,
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
          setDisplayBookings([]);
        } finally {
          setLoadingBookings(false);
        }
      };
      fetchBookings();
      fetchMyReviews();
    }

    if (activeTab === "reviews" && user && accessToken && userId) {
      fetchMyReviews();
    }
  }, [activeTab, user, userId, accessToken]);

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
      hour: "2-digit",
      minute: "2-digit",
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

  const hasReviewed = (tourId) => myReviews.some((r) => r.tour_id === tourId);
  const canReview = (booking) =>
    booking.payment_status === "paid" &&
    booking.tours?.id &&
    !hasReviewed(booking.tours.id);
  const canDelete = (booking) => booking.status === "cancelled";
  const canCancel = (booking) =>
    booking.payment_status === "unpaid" && booking.status !== "cancelled";

  // Handlers modal (giữ nguyên logic cũ của bạn)
  const handleCancelBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

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
    } catch {
      toast.error("Không thể hủy tour!");
    } finally {
      setShowCancelModal(false);
      setSelectedBookingId(null);
    }
  };

  const handleDeleteCancelledBooking = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const confirmDeleteBooking = () => {
    if (!bookingToDelete) return;
    setDisplayBookings((prev) =>
      prev.filter((b) => b.id !== bookingToDelete.id)
    );
    toast.success("Đã xóa tour đã hủy khỏi danh sách!");
    setShowDeleteModal(false);
    setBookingToDelete(null);
  };

  const handleOpenRatingModal = (tourId, existingReview = null) => {
    setSelectedTourId(tourId);
    setEditingReview(existingReview);
    setShowRatingModal(true);
  };

  const handleDeleteReview = (review) => {
    setReviewToDelete(review);
    setShowDeleteReviewModal(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await axios.delete(
        `${SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewToDelete.id}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Đã xóa đánh giá thành công!");
      await fetchMyReviews();
    } catch {
      toast.error("Không thể xóa đánh giá!");
    } finally {
      setShowDeleteReviewModal(false);
      setReviewToDelete(null);
    }
  };

  const handleReviewSuccess = async () => {
    await fetchMyReviews();
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
              Theo dõi đặt tour, điểm thưởng, voucher và đánh giá
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
            Đánh giá của tôi
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
              {loadingOverview ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải dữ liệu tổng quan...
                </div>
              ) : (
                <div className="cd2-stats-grid">
                  <div className="cd2-stat-card">
                    <div className="cd2-stat-icon bookings">Tour</div>
                    <div className="cd2-stat-value">{totalBookings}</div>
                    <div className="cd2-stat-label">Tour đã đặt</div>
                  </div>
                  <div className="cd2-stat-card">
                    <div className="cd2-stat-icon points">Điểm</div>
                    <div className="cd2-stat-value">
                      {rewardPoints.toLocaleString()}
                    </div>
                    <div className="cd2-stat-label">Điểm tích lũy</div>
                  </div>
                  <div className="cd2-stat-card">
                    <div className="cd2-stat-icon vouchers">Voucher</div>
                    <div className="cd2-stat-value">{totalVouchers}</div>
                    <div className="cd2-stat-label">Voucher đang có</div>
                  </div>
                  <div className="cd2-stat-card">
                    <div className="cd2-stat-icon reviews">Đánh giá</div>
                    <div className="cd2-stat-value">{totalReviews}</div>
                    <div className="cd2-stat-label">Đánh giá đã gửi</div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Lịch sử đặt tour */}
          {activeTab === "bookings" && (
            <div className="cd2-table-wrapper">
              <div className="cd2-table-header">
                <h3>Lịch sử đặt tour</h3>
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
                      const tourId = tour.id;
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
                            ) : canReview(booking) ? (
                              <button
                                className="cd2-btn review"
                                onClick={() => handleOpenRatingModal(tourId)}
                              >
                                Đánh giá
                              </button>
                            ) : hasReviewed(tourId) ? (
                              <span
                                style={{
                                  color: "#10b981",
                                  fontWeight: "600",
                                  fontSize: "0.9rem",
                                }}
                              >
                                Đã đánh giá ✓
                              </span>
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

          {/* Đánh giá của tôi */}
          {activeTab === "reviews" && (
            <div className="cd2-table-wrapper">
              <h3>Đánh giá của tôi ({myReviews.length})</h3>
              {loadingReviews ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải đánh giá...
                </div>
              ) : myReviews.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px",
                    color: "#888",
                  }}
                >
                  <p>Bạn chưa có đánh giá nào.</p>
                  <p>Hãy thanh toán tour và đánh giá để chia sẻ trải nghiệm!</p>
                </div>
              ) : (
                <div className="cd2-review-list">
                  {myReviews.map((review) => {
                    const tour = review.tours || {};
                    return (
                      <div key={review.id} className="cd2-review-item">
                        <div className="cd2-review-tour">
                          <img
                            src={tour.image || "https://via.placeholder.com/80"}
                            alt={tour.name}
                            className="cd2-review-img"
                          />
                          <div>
                            <h4>{tour.name}</h4>
                            <small>{tour.location}</small>
                          </div>
                        </div>
                        <div className="cd2-review-content">
                          <div className="cd2-review-stars">
                            {"★".repeat(review.rating) +
                              "☆".repeat(5 - review.rating)}
                          </div>
                          <p>{review.comment || "(Không có bình luận)"}</p>
                          <div className="cd2-review-meta">
                            <small>
                              <strong>Người đánh giá:</strong>{" "}
                              {user.full_name || "Bạn"}
                            </small>
                            <br />
                            <small>
                              Đánh giá lúc: {formatDate(review.created_at)}
                            </small>
                          </div>
                        </div>
                        <div className="cd2-review-actions">
                          <button
                            className="cd2-btn review"
                            onClick={() =>
                              handleOpenRatingModal(review.tour_id, review)
                            }
                          >
                            Sửa
                          </button>
                          <button
                            className="cd2-btn delete"
                            onClick={() => handleDeleteReview(review)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

          {/* Hồ sơ */}
          {activeTab === "profile" && (
            <div className="cd2-table-wrapper">
              <h3>Thông tin cá nhân</h3>
              {loadingProfile ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải thông tin...
                </div>
              ) : (
                <div className="cd2-profile-form">
                  <div className="cd2-input-group">
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="cd2-input-group">
                    <label>Email (không thể sửa)</label>
                    <input type="email" value={user.email || ""} readOnly />
                  </div>
                  <div className="cd2-input-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      value={profile.phone_number}
                      onChange={(e) =>
                        setProfile({ ...profile, phone_number: e.target.value })
                      }
                      placeholder="Chưa cập nhật"
                    />
                  </div>
                  <div className="cd2-input-group">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      placeholder="Chưa cập nhật"
                    />
                  </div>
                  <button
                    className="cd2-btn save"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Các modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Xác nhận hủy tour"
        message="Bạn có chắc chắn muốn hủy tour này? Hành động này không thể hoàn tác."
        onConfirm={confirmCancelBooking}
        onCancel={() => setShowCancelModal(false)}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Xóa tour đã hủy"
        message="Bạn có muốn xóa tour này khỏi danh sách không?"
        onConfirm={confirmDeleteBooking}
        onCancel={() => setShowDeleteModal(false)}
      />
      <ConfirmModal
        isOpen={showDeleteReviewModal}
        title="Xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này?"
        onConfirm={confirmDeleteReview}
        onCancel={() => setShowDeleteReviewModal(false)}
      />
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setEditingReview(null);
        }}
        tourId={selectedTourId}
        existingReview={editingReview}
        onSuccess={handleReviewSuccess}
      />

      <Footer />
    </>
  );
};

export default CustomerDashboard;
