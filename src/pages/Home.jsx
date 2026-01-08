// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TourCard from "../components/cards/TourCard";
import "../styles/pages/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [topRatedTours, setTopRatedTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const fetchTopRatedTours = async () => {
      try {
        // Lấy 4 tour có điểm trung bình cao nhất (ưu tiên review_count nếu bằng điểm)
        const { data } = await axios.get(
          `${SUPABASE_URL}/rest/v1/tours?status=eq.APPROVED&order=average_rating.desc,review_count.desc&limit=4&select=*`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        setTopRatedTours(data || []);
      } catch (err) {
        console.error("Lỗi tải tour nổi bật:", err);
        setTopRatedTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedTours();
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  return (
    <>
      <Header />
      <div className="hm-container">
        {/* Header chào mừng */}
        <header className="hm-header">
          <h1>Chào mừng đến với Hệ thống Đặt Tour Du Lịch AI</h1>
          <p>
            Khám phá những hành trình tuyệt vời nhất được cộng đồng du khách
            đánh giá cao
          </p>
        </header>

        {/* Hero */}
        <section className="hm-hero">
          <div className="hm-hero-content">
            <h2>Những tour được yêu thích nhất</h2>
            <p>
              Hàng ngàn du khách đã trải nghiệm và đánh giá 5 sao – bạn sẽ là
              người tiếp theo?
            </p>
            <button
              className="hm-btn-explore"
              onClick={() => navigate("/tours")}
            >
              Khám phá tất cả tour
            </button>
          </div>
        </section>

        {/* Tính năng nổi bật */}
        <section className="hm-features">
          <h2>Tại sao chọn chúng tôi?</h2>
          <div className="hm-features-grid">
            <div className="hm-feature-card">
              <div className="hm-feature-icon">⭐</div>
              <h3>Đánh giá thực tế</h3>
              <p>Chỉ hiển thị tour được du khách thật đánh giá cao</p>
            </div>
            <div className="hm-feature-card">
              <div className="hm-feature-icon">🤖</div>
              <h3>Chat bot tư vấn thông minh</h3>
              <p>Tour phù hợp nhất với sở thích và ngân sách của bạn</p>
            </div>
            <div className="hm-feature-card">
              <div className="hm-feature-icon">🎁</div>
              <h3>Tích điểm hấp dẫn</h3>
              <p>Nhận điểm thưởng và voucher sau mỗi chuyến đi</p>
            </div>
            <div className="hm-feature-card">
              <div className="hm-feature-icon">🔒</div>
              <h3>Thanh toán an toàn</h3>
              <p>Đặt tour nhanh chóng, bảo mật tuyệt đối</p>
            </div>
          </div>
        </section>

        {/* TOUR NỔI BẬT - 4 TOUR ĐIỂM CAO NHẤT */}
        <section className="hm-tours-section">
          <div className="hm-section-header">
            <h2>Tour được đánh giá cao nhất</h2>
            <button className="hm-view-all" onClick={() => navigate("/tours")}>
              Xem tất cả →
            </button>
          </div>

          {loading ? (
            <div className="hm-loading-tours">
              <p>Đang tải các tour nổi bật...</p>
            </div>
          ) : topRatedTours.length === 0 ? (
            <div className="hm-no-tours">
              <p>Chưa có tour nào được đánh giá.</p>
              <p>Hãy khám phá và là người đầu tiên chia sẻ trải nghiệm!</p>
            </div>
          ) : (
            <div className="hm-tours-grid">
              {topRatedTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>

        {/* Phần giới thiệu cuối trang */}
        <section className="hm-about">
          <div className="hm-about-content">
            <h2>Bắt đầu hành trình mơ ước của bạn ngay hôm nay</h2>
            <p>
              Chúng tôi không chỉ mang đến những chuyến đi – mà là những kỷ niệm
              đáng nhớ. Mỗi tour đều được chọn lọc kỹ lưỡng, đảm bảo chất lượng
              dịch vụ tốt nhất và trải nghiệm chân thực nhất.
            </p>
            <p>
              Từ những cung đường núi Tây Bắc hùng vĩ, biển đảo trong xanh miền
              Trung, đến những cánh đồng lúa mênh mông miền Tây – tất cả đang
              chờ bạn khám phá cùng chúng tôi.
            </p>
            <button className="hm-btn-start" onClick={() => navigate("/tours")}>
              Tìm tour phù hợp ngay
            </button>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Home;
