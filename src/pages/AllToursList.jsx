// src/pages/AllToursList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TourCard from "../components/cards/TourCard";
import "../styles/pages/AllToursList.css";

const AllToursList = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const fetchApprovedTours = async () => {
      try {
        const { data } = await axios.get(
          `${supabaseUrl}/rest/v1/tours?status=eq.APPROVED&select=*,average_rating,review_count&order=created_at.desc`,
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
          }
        );
        setTours(data || []);
      } catch (err) {
        console.error("Lỗi tải tour:", err);
        toast.error("Không thể tải danh sách tour!");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedTours();
  }, [supabaseUrl, anonKey]);

  return (
    <>
      <Header />
      <div className="atl-container">
        <header className="atl-header">
          <h1>Tất cả các tour du lịch</h1>
          <p>Khám phá những hành trình tuyệt vời đang chờ bạn</p>
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

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px",
              color: "#666",
              fontSize: "1.2rem",
            }}
          >
            Đang tải các tour...
          </div>
        ) : tours.length === 0 ? (
          <div className="atl-no-data">
            <p>Chưa có tour nào được duyệt.</p>
            <p>Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="atl-grid">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AllToursList;
