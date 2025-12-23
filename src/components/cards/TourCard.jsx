// src/components/cards/TourCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/components/cards/TourCard.css";

const TourCard = ({ tour }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return price ? price.toLocaleString("vi-VN") + "đ" : "Liên hệ";
  };

  // Placeholder ảnh đẹp nếu chưa có ảnh hoặc lỗi load
  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  // Kiểm tra tour có phải "mới" không (tạo trong vòng 7 ngày gần nhất)
  const isNewTour = () => {
    if (!tour.created_at) return false;
    const createdDate = new Date(tour.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // Xử lý click vào card hoặc button để xem chi tiết
  const handleViewDetail = (e) => {
    e.stopPropagation();
    if (tour.id) {
      navigate(`/tours/${tour.id}`);
    }
  };

  // Hiển thị duration
  const formatDuration = () => {
    if (tour.duration_days && tour.duration_nights) {
      return `${tour.duration_days} ngày ${tour.duration_nights} đêm`;
    } else if (tour.duration_days) {
      return `${tour.duration_days} ngày`;
    }
    return "Liên hệ";
  };

  return (
    <div className="tour-card" onClick={handleViewDetail}>
      <div className="tour-image-wrapper">
        <img
          src={tour.image || placeholderImage}
          alt={tour.name || "Tour du lịch"}
          className="tour-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
        />

        {/* Badge đánh giá (có thể thay bằng dữ liệu thật sau) */}
        <div className="tour-rating-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          4.8
        </div>

        {/* Badge "Mới" nếu tour mới tạo */}
        {isNewTour() && <div className="tour-new-badge">MỚI</div>}
      </div>

      <div className="tour-info">
        <h3 className="tour-name">{tour.name || "Tour chưa có tên"}</h3>

        <p className="tour-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {tour.location || "Việt Nam"}
        </p>

        <p className="tour-duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M12 6v6l4 2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          {formatDuration()}
        </p>

        <div className="tour-price-wrapper">
          <span className="tour-price">{formatPrice(tour.price)}</span>
          <span className="tour-per-person">/ người</span>
        </div>

        <button className="tour-btn-detail" onClick={handleViewDetail}>
          Xem chi tiết <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default TourCard;
