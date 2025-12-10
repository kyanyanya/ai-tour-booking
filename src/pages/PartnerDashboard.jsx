// src/pages/PartnerDashboard.jsx
import React, { useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreateTourForm from "../components/forms/CreateTourForm";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/pages/PartnerDashboard.css";

const PartnerDashboard = () => {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchTours = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;

    setLoading(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/tours?select=*&partner_id=eq.${user.id}&order=created_at.desc`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setTours(data || []);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách tour!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token, supabaseUrl, anonKey]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "tours") fetchTours();
  };

  if (!user || user.role !== "partner") {
    return <Navigate to="/login" replace />;
  }

  // Helper
  const formatPrice = (price) =>
    price ? price.toLocaleString("vi-VN") + "đ" : "-";
  const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "Chờ duyệt";
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Bị từ chối";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "pending";
      case "APPROVED":
        return "confirmed";
      case "REJECTED":
        return "cancelled";
      default:
        return "";
    }
  };

  return (
    <>
      <Header />

      <div className="pd-container">
        {/* Topbar */}
        <div className="pd-topbar">
          <div className="pd-topbar-left">
            <h1 className="pd-title">Bảng điều khiển Đối tác</h1>
            <p className="pd-subtitle">
              Quản lý tours, đơn hàng và doanh thu của bạn
            </p>
          </div>
          <div className="pd-topbar-right">
            <button
              className="pd-btn-create"
              onClick={() => setIsFormOpen(true)}
            >
              + Tạo tour mới
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="pd-tabs">
          {[
            { id: "overview", label: "Tổng quan" },
            { id: "tours", label: "Tour của bạn" },
            { id: "orders", label: "Đơn hàng" },
            { id: "recentBookings", label: "Đặt chỗ gần đây" },
            { id: "analytics", label: "Phân tích" },
            { id: "payments", label: "Thanh toán" },
            { id: "reviews", label: "Đánh giá" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`pd-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nội dung */}
        <div className="pd-content">
          {/* Tổng quan - giữ nguyên */}
          {activeTab === "overview" && (
            <div className="pd-stats-grid">
              <div className="pd-stat-card">
                <div className="pd-stat-icon bookings">Bookings</div>
                <div className="pd-stat-value">0</div>
                <div className="pd-stat-label">Tổng đặt chỗ</div>
              </div>
              <div className="pd-stat-card">
                <div className="pd-stat-icon revenue">Revenue</div>
                <div className="pd-stat-value">0đ</div>
                <div className="pd-stat-label">Doanh thu</div>
              </div>
              <div className="pd-stat-card">
                <div className="pd-stat-icon customers">Customers</div>
                <div className="pd-stat-value">0</div>
                <div className="pd-stat-label">Khách hàng</div>
              </div>
              <div className="pd-stat-card">
                <div className="pd-stat-icon reviews">Reviews</div>
                <div className="pd-stat-value">0.0</div>
                <div className="pd-stat-label">Đánh giá trung bình</div>
              </div>
            </div>
          )}

          {/* BẢNG TOUR MỚI - ĐẸP NHƯ ALLPRODUCTS */}
          {activeTab === "tours" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Danh sách Tour của bạn ({tours.length})</h3>
                <button
                  className="pd-btn-create"
                  onClick={() => setIsFormOpen(true)}
                >
                  + Thêm tour mới
                </button>
              </div>

              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  Đang tải tour...
                </div>
              ) : tours.length === 0 ? (
                <div className="pd-no-data">
                  <p>Chưa có tour nào được tạo.</p>
                  <p>Nhấn nút "Thêm tour mới" để bắt đầu!</p>
                </div>
              ) : (
                <table className="pd-tours-table">
                  <thead>
                    <tr>
                      <th>Tên Tour</th>
                      <th>Địa điểm</th>
                      <th>Giá</th>
                      <th>Số ngày</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tours.map((tour) => (
                      <tr key={tour.id}>
                        <td className="pd-tour-name">{tour.name}</td>
                        <td>{tour.location || "-"}</td>
                        <td>{formatPrice(tour.price)}</td>
                        <td>{tour.duration_days || "-"}</td>
                        <td>
                          <span
                            className={`pd-status ${getStatusClass(
                              tour.status
                            )}`}
                          >
                            {getStatusText(tour.status)}
                          </span>
                        </td>
                        <td>{formatDate(tour.created_at)}</td>
                        <td>
                          <button className="pd-btn edit">Sửa</button>
                          <button className="pd-btn stop">
                            {tour.status === "APPROVED"
                              ? "Tạm dừng"
                              : "Kích hoạt"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Các tab khác */}
          {[
            "orders",
            "recentBookings",
            "analytics",
            "payments",
            "reviews",
          ].includes(activeTab) && (
            <div className="pd-table-wrapper">
              <h3>
                {activeTab === "orders" && "Đơn hàng"}
                {activeTab === "recentBookings" && "Đặt chỗ gần đây"}
                {activeTab === "analytics" && "Phân tích"}
                {activeTab === "payments" && "Thanh toán"}
                {activeTab === "reviews" && "Đánh giá"}
              </h3>
              <p
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#888",
                }}
              >
                Chưa có dữ liệu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CreateTourForm
              onClose={() => setIsFormOpen(false)}
              onSuccess={() => {
                fetchTours();
                setIsFormOpen(false);
                toast.success("Tạo tour thành công!");
              }}
            />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PartnerDashboard;
