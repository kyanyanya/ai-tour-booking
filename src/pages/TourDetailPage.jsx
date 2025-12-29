// src/pages/TourDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import "../styles/pages/TourDetailPage.css";

const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal booking - đơn giản như cũ
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState(1);

  // Lịch trình collapsible
  const [openDays, setOpenDays] = useState({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const fetchTourDetail = async () => {
      try {
        const { data } = await axios.get(
          `${supabaseUrl}/rest/v1/tours?id=eq.${id}&select=*`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          }
        );

        if (data && data.length > 0) {
          setTour(data[0]);
        } else {
          toast.error("Không tìm thấy tour!");
          navigate("/tours");
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết tour:", err);
        toast.error("Không thể tải thông tin tour!");
        navigate("/tours");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTourDetail();
  }, [id, supabaseUrl, anonKey, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleDay = (index) => {
    setOpenDays((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderItineraryDay = (item, index) => {
    const isOpen = openDays[index];

    let title = "";
    let description = "";
    let activities = [];

    if (typeof item === "string") {
      description = item;
      title = `Ngày ${index + 1}`;
    } else if (typeof item === "object" && item !== null) {
      title = item.title || `Ngày ${index + 1}`;
      description = item.description || "";
      activities = Array.isArray(item.activities) ? item.activities : [];
    } else {
      title = `Ngày ${index + 1}`;
    }

    return (
      <div key={index} className="tdp-itinerary-day-item">
        <div
          className="tdp-itinerary-day-header"
          onClick={() => toggleDay(index)}
        >
          <h3 className="tdp-itinerary-day-title">
            <span className="tdp-day-label">Ngày {index + 1}:</span>
            <span className="tdp-day-content">
              {title.replace(`Ngày ${index + 1}`, "").trim()}
            </span>
            <span className="tdp-toggle-arrow">{isOpen ? "▲" : "▼"}</span>
          </h3>
        </div>

        {isOpen && (
          <div className="tdp-itinerary-day-content">
            {description && (
              <p className="tdp-day-description">{description}</p>
            )}
            {activities.length > 0 && (
              <ul className="tdp-day-activities">
                {activities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            )}
            {!description && activities.length === 0 && (
              <p className="tdp-no-detail">
                Chưa có thông tin chi tiết cho ngày này.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleBookNow = () => {
    if (!user || !session) {
      toast.warning("Vui lòng đăng nhập để đặt tour!");
      navigate("/login", { state: { from: `/tours/${id}` } });
      return;
    }
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate) {
      toast.error("Vui lòng chọn ngày khởi hành!");
      return;
    }
    if (numberOfPeople < 1) {
      toast.error("Số lượng người phải ít nhất là 1!");
      return;
    }

    const totalPrice = tour.price * numberOfPeople;

    try {
      const response = await axios.post(
        `${supabaseUrl}/rest/v1/bookings`,
        {
          user_id: user.id,
          tour_id: tour.id,
          booking_date: bookingDate,
          number_of_people: numberOfPeople,
          total_price: totalPrice,
          status: "pending",
          payment_status: "unpaid",
          // Không gửi contact_name và contact_phone → sẽ cập nhật ở trang checkout sau
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
        }
      );

      const newBooking = response.data[0];
      toast.success("Tạo đơn đặt tour thành công!");

      navigate("/checkout/contact", {
        state: {
          bookingId: newBooking.id,
          tour: tour,
          numberOfPeople,
          totalPrice,
          bookingDate,
        },
      });

      setShowBookingModal(false);
    } catch (err) {
      console.error("Lỗi tạo booking:", err.response?.data || err);
      toast.error("Không thể tạo đơn đặt tour. Vui lòng thử lại!");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="tdp-loading">
          <div className="tdp-spinner"></div>
          <p>Đang tải thông tin tour...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!tour) {
    return (
      <>
        <Header />
        <div className="tdp-not-found">
          <h2>Không tìm thấy tour</h2>
          <button onClick={() => navigate("/tours")} className="tdp-back-btn">
            Quay lại danh sách tour
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="tdp-container">
        <button onClick={() => navigate(-1)} className="tdp-back-button">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <div className="tdp-hero">
          <div className="tdp-image-wrapper">
            {tour.image ? (
              <img src={tour.image} alt={tour.name} className="tdp-image" />
            ) : (
              <div className="tdp-no-image">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Chưa có hình ảnh</p>
              </div>
            )}
          </div>

          <div className="tdp-hero-info">
            <h1 className="tdp-title">{tour.name}</h1>

            <div className="tdp-meta">
              <div className="tdp-meta-item">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{tour.location || "Chưa có thông tin"}</span>
              </div>

              <div className="tdp-meta-item">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {tour.duration_days
                    ? `${tour.duration_days} ngày ${
                        tour.duration_nights
                          ? `- ${tour.duration_nights} đêm`
                          : ""
                      }`
                    : "Chưa xác định"}
                </span>
              </div>

              <div className="tdp-meta-item">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span>{tour.partner_name || "Đối tác"}</span>
              </div>
            </div>

            <div className="tdp-price-section">
              <div className="tdp-price-label">Giá tour / người</div>
              <div className="tdp-price">{formatPrice(tour.price)}</div>
              <div className="tdp-price-note">
                * Giá có thể thay đổi theo số lượng người
              </div>
            </div>

            <button className="tdp-book-button" onClick={handleBookNow}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Đặt tour ngay
            </button>
          </div>
        </div>

        <div className="tdp-content">
          <div className="tdp-section">
            <h2 className="tdp-section-title">Mô tả tour</h2>
            <div className="tdp-description">
              {tour.description ? (
                <p>{tour.description}</p>
              ) : (
                <p className="tdp-no-data">Chưa có mô tả chi tiết</p>
              )}
            </div>
          </div>

          {tour.itinerary &&
            Array.isArray(tour.itinerary) &&
            tour.itinerary.length > 0 && (
              <div className="tdp-section">
                <h2 className="tdp-section-title">Lịch trình chi tiết</h2>
                <div className="tdp-itinerary">
                  {tour.itinerary.map((item, index) =>
                    renderItineraryDay(item, index)
                  )}
                </div>
              </div>
            )}

          <div className="tdp-section">
            <h2 className="tdp-section-title">Thông tin bổ sung</h2>
            <div className="tdp-info-grid">
              <div className="tdp-info-card">
                <div className="tdp-info-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="tdp-info-content">
                  <h3>Trạng thái</h3>
                  <p
                    className={`tdp-status tdp-status-${tour.status?.toLowerCase()}`}
                  >
                    {tour.status === "APPROVED"
                      ? "Đã duyệt"
                      : tour.status === "PENDING_APPROVAL"
                      ? "Chờ duyệt"
                      : tour.status === "REJECTED"
                      ? "Bị từ chối"
                      : "Tạm dừng"}
                  </p>
                </div>
              </div>

              <div className="tdp-info-card">
                <div className="tdp-info-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="tdp-info-content">
                  <h3>Ngày tạo</h3>
                  <p>{formatDate(tour.created_at)}</p>
                </div>
              </div>

              <div className="tdp-info-card">
                <div className="tdp-info-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="tdp-info-content">
                  <h3>Đối tác</h3>
                  <p>{tour.partner_name || "Chưa cập nhật"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal đặt tour - đơn giản như cũ */}
        {showBookingModal && (
          <div
            className="tdp-modal-overlay"
            onClick={() => setShowBookingModal(false)}
          >
            <div className="tdp-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Xác nhận đặt tour</h2>
              <p>
                <strong>{tour.name}</strong>
              </p>
              <p>Giá: {formatPrice(tour.price)} / người</p>

              <div className="tdp-modal-form">
                <label>Ngày khởi hành</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />

                <label>Số lượng người</label>
                <input
                  type="number"
                  min="1"
                  value={numberOfPeople}
                  onChange={(e) =>
                    setNumberOfPeople(parseInt(e.target.value) || 1)
                  }
                />

                <div className="tdp-modal-total">
                  <strong>
                    Tổng tiền: {formatPrice(tour.price * numberOfPeople)}
                  </strong>
                </div>
              </div>

              <div className="tdp-modal-actions">
                <button
                  className="tdp-btn-cancel"
                  onClick={() => setShowBookingModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="tdp-btn-confirm"
                  onClick={handleConfirmBooking}
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default TourDetailPage;
