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
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8; // 8 tour mỗi trang

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

  // Tính toán các tour hiển thị trên trang hiện tại
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTours = tours.slice(indexOfFirstItem, indexOfLastItem);

  // Tổng số trang
  const totalPages = Math.ceil(tours.length / itemsPerPage);

  // Thay đổi trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Cuộn lên đầu grid để người dùng dễ thấy nội dung mới
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tạo mảng các số trang để hiển thị (tối đa 5 nút số, ưu tiên trang hiện tại)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

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
          <div className="atl-loading">Đang tải các tour...</div>
        ) : tours.length === 0 ? (
          <div className="atl-no-data">
            <p>Chưa có tour nào được duyệt.</p>
            <p>Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <>
            <div className="atl-grid">
              {currentTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="atl-pagination">
                {/* Nút Đầu */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="atl-page-btn atl-page-first-last"
                >
                  «« Đầu
                </button>

                {/* Nút Trước */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="atl-page-btn"
                >
                  ‹ Trước
                </button>

                {/* Các số trang */}
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="atl-page-dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => handlePageChange(page)}
                      className={`atl-page-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Nút Sau */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="atl-page-btn"
                >
                  Sau ›
                </button>

                {/* Nút Cuối */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="atl-page-btn atl-page-first-last"
                >
                  Cuối »»
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AllToursList;
