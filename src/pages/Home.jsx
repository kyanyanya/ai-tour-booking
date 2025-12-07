import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/Home.css";

const Home = () => {
  // Dữ liệu mẫu
  const featuredTours = [
    {
      id: 1,
      name: "Tour Đà Lạt 3N2Đ",
      price: "2.990.000",
      originalPrice: "3.990.000",
      duration: "3 ngày",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      badge: "Nổi bật",
    },
    {
      id: 2,
      name: "Tour Phú Quốc 4N3Đ",
      price: "6.500.000",
      originalPrice: "8.200.000",
      duration: "4 ngày",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      badge: "Bán chạy",
    },
    {
      id: 3,
      name: "Tour Nha Trang Biển",
      price: "3.800.000",
      duration: "3 ngày",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1519046902490-d3a31e1d7f4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      name: "Tour Đà Nẵng - Hội An",
      price: "3.500.000",
      duration: "4 ngày",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
  ];

  const flashSaleTours = [
    {
      id: 5,
      name: "Tour Vũng Tàu 2N1Đ",
      price: "1.290.000",
      originalPrice: "1.890.000",
      duration: "2 ngày",
      rating: 4.4,
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      discount: "-32%",
    },
    {
      id: 6,
      name: "Tour Cần Thơ - Miền Tây",
      price: "1.599.000",
      originalPrice: "2.200.000",
      duration: "3 ngày",
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      discount: "-27%",
    },
    {
      id: 7,
      name: "Tour Huế Cố Đô",
      price: "1.999.000",
      originalPrice: "2.800.000",
      duration: "3 ngày",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      discount: "-29%",
    },
    {
      id: 8,
      name: "Tour Sapa - Fansipan",
      price: "3.490.000",
      originalPrice: "4.500.000",
      duration: "4 ngày",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1555400039-8d6b76d1e5d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      discount: "-22%",
    },
  ];

  return (
    <>
      <Header />
      <div className="hm-container">
        {/* Header */}
        <header className="hm-header">
          <h1>Chào mừng đến với Hệ thống Đặt Tour Du Lịch AI</h1>
          <p>
            Khám phá, đặt tour và trải nghiệm du lịch thông minh cùng AI gợi ý
            cá nhân hóa!
          </p>
        </header>

        {/* Hero */}
        <section className="hm-hero">
          <div className="hm-hero-content">
            <h2>Tìm tour phù hợp với bạn</h2>
            <button className="hm-btn-explore">Khám phá ngay</button>
          </div>
        </section>

        {/* Tính năng */}
        <section className="hm-features">
          <h2>Tính năng nổi bật</h2>
          <div className="hm-features-grid">
            <div className="hm-feature-card">
              <h3>AI Gợi ý thông minh</h3>
              <p>Dựa trên sở thích, mùa và vị trí của bạn</p>
            </div>
            <div className="hm-feature-card">
              <h3>Đặt tour dễ dàng</h3>
              <p>Chọn ngày, thanh toán online an toàn</p>
            </div>
            <div className="hm-feature-card">
              <h3>Đánh giá & Tích điểm</h3>
              <p>Nhận voucher sau mỗi chuyến đi</p>
            </div>
          </div>
        </section>

        {/* TOUR NỔI BẬT */}
        <section className="hm-tours-section">
          <div className="hm-section-header">
            <h2>Tour Nổi Bật</h2>
            <a href="/tours" className="hm-view-all">
              Xem tất cả →
            </a>
          </div>
          <div className="hm-tours-grid">
            {featuredTours.map((tour) => (
              <div key={tour.id} className="hm-tour-card">
                <div className="hm-image-wrapper">
                  <img src={tour.image} alt={tour.name} className="hm-image" />
                  {tour.badge && (
                    <span className="hm-badge hm-badge-featured">
                      {tour.badge}
                    </span>
                  )}
                  <div className="hm-rating-badge">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {tour.rating}
                  </div>
                </div>
                <div className="hm-info">
                  <h3>{tour.name}</h3>
                  <p className="hm-duration">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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
                    {tour.duration}
                  </p>
                  <div className="hm-price-group">
                    {tour.originalPrice && (
                      <span className="hm-original-price">
                        {tour.originalPrice}₫
                      </span>
                    )}
                    <span className="hm-price">{tour.price}₫</span>
                  </div>
                  <button className="hm-btn-detail">Xem chi tiết</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FLASH SALE */}
        <section className="hm-tours-section hm-flash-sale">
          <div className="hm-section-header">
            <h2>
              <span className="hm-flash-icon">Flash Sale</span> Giảm Giá Sốc
            </h2>
            <a href="/tours" className="hm-view-all">
              Xem tất cả →
            </a>
          </div>
          <div className="hm-tours-grid">
            {flashSaleTours.map((tour) => (
              <div key={tour.id} className="hm-tour-card">
                <div className="hm-image-wrapper">
                  <img src={tour.image} alt={tour.name} className="hm-image" />
                  {tour.discount && (
                    <span className="hm-badge hm-badge-sale">
                      {tour.discount}
                    </span>
                  )}
                  <div className="hm-rating-badge">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {tour.rating}
                  </div>
                </div>
                <div className="hm-info">
                  <h3>{tour.name}</h3>
                  <p className="hm-duration">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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
                    {tour.duration}
                  </p>
                  <div className="hm-price-group">
                    <span className="hm-original-price">
                      {tour.originalPrice}₫
                    </span>
                    <span className="hm-price">{tour.price}₫</span>
                  </div>
                  <button className="hm-btn-detail hm-btn-sale">
                    Đặt ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Home;
