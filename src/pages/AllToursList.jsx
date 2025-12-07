import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/pages/AllToursList.css";

const AllToursList = () => {
  const tours = [
    {
      id: 1,
      name: "Tour Đà Lạt 3N2Đ",
      price: "2.990.000",
      duration: "3 ngày",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      name: "Tour Phú Quốc 4N3Đ",
      price: "6.500.000",
      duration: "4 ngày",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      name: "Tour Hà Nội - Sapa",
      price: "4.200.000",
      duration: "5 ngày",
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      name: "Tour Nha Trang Biển",
      price: "3.800.000",
      duration: "3 ngày",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1519046902490-d3a31e1d7f4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      name: "Tour Đà Nẵng - Hội An",
      price: "3.500.000",
      duration: "4 ngày",
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 6,
      name: "Tour Huế Cố Đô",
      price: "2.800.000",
      duration: "3 ngày",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 7,
      name: "Tour Vũng Tàu 2N1Đ",
      price: "1.890.000",
      duration: "2 ngày",
      rating: 4.4,
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 8,
      name: "Tour Cần Thơ - Miền Tây",
      price: "2.200.000",
      duration: "3 ngày",
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <>
      <Header />
      <div className="atl-container">
        <header className="atl-header">
          <h1>Tất cả các tour du lịch</h1>
          <p>Khám phá hàng trăm tour hấp dẫn được gợi ý bởi AI</p>
        </header>

        <div className="atl-filters">
          <input
            type="text"
            placeholder="Tìm kiếm tour..."
            className="atl-search-input"
          />
          <select className="atl-filter-select">
            <option>Khu vực</option>
            <option>Miền Bắc</option>
            <option>Miền Trung</option>
            <option>Miền Nam</option>
          </select>
          <select className="atl-filter-select">
            <option>Giá tiền</option>
            <option>Dưới 3 triệu</option>
            <option>3 - 5 triệu</option>
            <option>Trên 5 triệu</option>
          </select>
        </div>

        <div className="atl-grid">
          {tours.map((tour) => (
            <div key={tour.id} className="atl-card">
              <div className="atl-image-wrapper">
                <img src={tour.image} alt={tour.name} className="atl-image" />
                <div className="atl-rating-badge">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {tour.rating}
                </div>
              </div>
              <div className="atl-info">
                <h3>{tour.name}</h3>
                <p className="atl-duration">
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
                <div className="atl-meta">
                  <span className="atl-price">{tour.price}₫</span>
                  <span className="atl-per-person">/ người</span>
                </div>
                <button className="atl-btn-detail">Xem chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllToursList;
