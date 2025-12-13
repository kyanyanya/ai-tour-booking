// src/pages/PartnerDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreateTourForm from "../components/forms/CreateTourForm";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/pages/PartnerDashboard.css";

const PartnerDashboard = () => {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [deleteRequestModal, setDeleteRequestModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
  });

  const [toggleStatusModal, setToggleStatusModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    currentStatus: "",
  });

  const [deleteNotifModal, setDeleteNotifModal] = useState({
    isOpen: false,
    notifId: null,
  });

  const [clearAllModal, setClearAllModal] = useState(false);
  const [markAllReadModal, setMarkAllReadModal] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Hàm gửi thông báo đến TẤT CẢ Admin (dùng view admin_ids_view → ổn định, không lỗi 404)
  const notifyAllAdmins = async (message, type, tourId = null) => {
    if (!session?.access_token) return;

    try {
      const { data: admins } = await axios.get(
        `${supabaseUrl}/rest/v1/admin_ids_view`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!admins || admins.length === 0) {
        console.warn("Không có Admin nào để gửi thông báo.");
        return;
      }

      for (const admin of admins) {
        await axios.post(
          `${supabaseUrl}/rest/v1/admin_notifications`,
          {
            to_admin_id: admin.admin_id,
            from_role: "partner",
            from_id: user.id,
            message,
            type,
            tour_id: tourId,
            status: "unread",
          },
          {
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (err) {
      console.error("Lỗi gửi thông báo đến Admin:", err);
    }
  };

  const fetchTours = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    setLoadingTours(true);
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
    } catch (err) {
      console.error("Lỗi tải tour:", err);
      toast.error("Lỗi khi tải danh sách tour!");
    } finally {
      setLoadingTours(false);
    }
  }, [user?.id, session?.access_token, supabaseUrl, anonKey]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    setLoadingNotifs(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/partner_notifications?to_partner_id=eq.${user.id}&order=created_at.desc`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setNotifications(data || []);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
      toast.error("Lỗi khi tải thông báo!");
    } finally {
      setLoadingNotifs(false);
    }
  }, [user?.id, session?.access_token, supabaseUrl, anonKey]);

  const markAsRead = async (notifId) => {
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/partner_notifications?id=eq.${notifId}`,
        { status: "read" },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, status: "read" } : n))
      );
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  const openMarkAllReadModal = () => {
    if (unreadCount === 0) {
      toast.info("Không có thông báo nào chưa đọc!");
      return;
    }
    setMarkAllReadModal(true);
  };

  const confirmMarkAllRead = async () => {
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        { status: "read" },
        {
          params: { to_partner_id: `eq.${user.id}`, status: "eq.unread" },
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Đã đánh dấu tất cả là đã đọc!");
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả:", err);
      toast.error("Không thể đánh dấu tất cả!");
    } finally {
      setMarkAllReadModal(false);
    }
  };

  const openClearAllModal = () => {
    if (notifications.length === 0) {
      toast.info("Không có thông báo nào để xóa!");
      return;
    }
    setClearAllModal(true);
  };

  const confirmClearAll = async () => {
    try {
      await axios.delete(`${supabaseUrl}/rest/v1/partner_notifications`, {
        params: { to_partner_id: `eq.${user.id}` },
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      toast.success("Đã xóa tất cả thông báo!");
      setNotifications([]);
    } catch (err) {
      console.error("Lỗi xóa tất cả:", err);
      toast.error("Không thể xóa tất cả thông báo!");
    } finally {
      setClearAllModal(false);
    }
  };

  const openToggleStatusModal = (tour) => {
    setToggleStatusModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
      currentStatus: tour.status,
    });
  };

  const confirmToggleStatus = async () => {
    const { tourId, tourName, currentStatus } = toggleStatusModal;
    const newStatus = currentStatus === "APPROVED" ? "PAUSED" : "APPROVED";
    const actionText =
      currentStatus === "APPROVED" ? "tạm dừng" : "kích hoạt lại";

    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/tours?id=eq.${tourId}`,
        { status: newStatus },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await notifyAllAdmins(
        `Partner "${user.full_name}" đã ${actionText} tour "${tourName}"`,
        newStatus === "PAUSED" ? "tour_paused" : "tour_reactivated",
        tourId
      );

      toast.success(`Đã ${actionText} tour thành công!`);
      fetchTours();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái tour:", err);
      toast.error("Không thể thay đổi trạng thái tour!");
    } finally {
      setToggleStatusModal({
        isOpen: false,
        tourId: null,
        tourName: "",
        currentStatus: "",
      });
    }
  };

  const openDeleteRequestModal = (tour) => {
    setDeleteRequestModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
    });
  };

  const confirmDeleteRequest = async () => {
    const { tourId, tourName } = deleteRequestModal;
    try {
      await notifyAllAdmins(
        `Partner "${user.full_name}" yêu cầu XÓA tour: "${tourName}"`,
        "tour_delete_request",
        tourId
      );

      toast.success("Đã gửi yêu cầu xóa tour đến tất cả Admin!");
      setDeleteRequestModal({ isOpen: false, tourId: null, tourName: "" });
    } catch (err) {
      console.error("Lỗi gửi yêu cầu xóa tour:", err);
      toast.error("Không thể gửi yêu cầu!");
    }
  };

  const openDeleteNotifModal = (notifId) => {
    setDeleteNotifModal({ isOpen: true, notifId });
  };

  const confirmDeleteNotification = async () => {
    try {
      await axios.delete(
        `${supabaseUrl}/rest/v1/partner_notifications?id=eq.${deleteNotifModal.notifId}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      toast.success("Đã xóa thông báo!");
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi xóa thông báo:", err);
      toast.error("Không thể xóa thông báo!");
    } finally {
      setDeleteNotifModal({ isOpen: false, notifId: null });
    }
  };

  useEffect(() => {
    if (activeTab === "tours") fetchTours();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, fetchTours, fetchNotifications]);

  if (!user || user.role !== "partner") return <Navigate to="/login" replace />;

  const formatPrice = (price) =>
    price ? price.toLocaleString("vi-VN") + "đ" : "-";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusText = (status) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "Chờ duyệt";
      case "APPROVED":
        return "Đang hoạt động";
      case "PAUSED":
        return "Tạm dừng";
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
      case "PAUSED":
        return "paused";
      case "REJECTED":
        return "cancelled";
      default:
        return "";
    }
  };

  const getNotifTypeText = (type) => {
    switch (type) {
      case "tour_approved":
        return "Tour được duyệt";
      case "tour_rejected":
        return "Tour bị từ chối";
      case "tour_deleted":
        return "Tour đã bị xóa";
      default:
        return "Thông báo";
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <>
      <Header />
      <div className="pd-container">
        <div className="pd-topbar">
          <div className="pd-topbar-left">
            <h1 className="pd-title">Bảng điều khiển Đối tác</h1>
            <p className="pd-subtitle">Quản lý tours và thông báo</p>
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

        <div className="pd-tabs">
          {[
            { id: "overview", label: "Tổng quan" },
            { id: "tours", label: "Tour của bạn" },
            {
              id: "notifications",
              label: `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { id: "orders", label: "Đơn hàng" },
            { id: "recentBookings", label: "Đặt chỗ gần đây" },
            { id: "analytics", label: "Phân tích" },
            { id: "payments", label: "Thanh toán" },
            { id: "reviews", label: "Đánh giá" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`pd-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pd-content">
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

              {loadingTours ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
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
                        <td className="pd-actions">
                          <button className="pd-btn edit">Sửa</button>

                          {(tour.status === "APPROVED" ||
                            tour.status === "PAUSED") && (
                            <button
                              className={`pd-btn ${
                                tour.status === "APPROVED" ? "stop" : "start"
                              }`}
                              onClick={() => openToggleStatusModal(tour)}
                            >
                              {tour.status === "APPROVED"
                                ? "Tạm dừng"
                                : "Kích hoạt"}
                            </button>
                          )}

                          {tour.status === "PAUSED" && (
                            <button
                              className="pd-btn delete"
                              onClick={() => openDeleteRequestModal(tour)}
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Thông báo ({notifications.length})</h3>
                <div className="pd-notif-actions">
                  <button
                    className="pd-btn secondary"
                    onClick={openMarkAllReadModal}
                    disabled={unreadCount === 0}
                  >
                    Đánh dấu đọc tất cả
                  </button>
                  <button
                    className="pd-btn danger"
                    onClick={openClearAllModal}
                    disabled={notifications.length === 0}
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              {loadingNotifs ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="pd-no-data">
                  <p>Chưa có thông báo nào.</p>
                </div>
              ) : (
                <div className="pd-notifications-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`pd-notification-item ${
                        notif.status === "unread" ? "unread" : ""
                      }`}
                    >
                      <div className="pd-notif-header">
                        <strong>{getNotifTypeText(notif.type)}</strong>
                        <span className="pd-notif-date">
                          {formatDate(notif.created_at)}
                        </span>
                        <button
                          className="pd-btn notif-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteNotifModal(notif.id);
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                      <p className="pd-notif-message">{notif.message}</p>
                      {notif.status === "unread" && (
                        <small
                          style={{
                            color: "#4361ee",
                            fontStyle: "italic",
                            cursor: "pointer",
                          }}
                          onClick={() => markAsRead(notif.id)}
                        >
                          Nhấn để đánh dấu đã đọc
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

      {/* Modal tạo tour */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CreateTourForm
              onClose={() => setIsFormOpen(false)}
              onSuccess={async () => {
                await fetchTours();
                setIsFormOpen(false);
                toast.success(
                  "Tạo tour thành công! Đã gửi thông báo đến tất cả Admin."
                );
              }}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={toggleStatusModal.isOpen}
        title="Xác nhận thay đổi trạng thái"
        message={`Bạn có chắc muốn ${
          toggleStatusModal.currentStatus === "APPROVED"
            ? "TẠM DỪNG"
            : "KÍCH HOẠT LẠI"
        } tour "${toggleStatusModal.tourName}"?`}
        onConfirm={confirmToggleStatus}
        onCancel={() =>
          setToggleStatusModal({
            isOpen: false,
            tourId: null,
            tourName: "",
            currentStatus: "",
          })
        }
      />

      <ConfirmModal
        isOpen={deleteRequestModal.isOpen}
        title="Yêu cầu xóa tour"
        message={`Bạn có chắc muốn gửi yêu cầu XÓA tour "${deleteRequestModal.tourName}" đến Admin?`}
        onConfirm={confirmDeleteRequest}
        onCancel={() =>
          setDeleteRequestModal({ isOpen: false, tourId: null, tourName: "" })
        }
      />

      <ConfirmModal
        isOpen={deleteNotifModal.isOpen}
        title="Xóa thông báo"
        message="Bạn có chắc muốn xóa thông báo này?"
        onConfirm={confirmDeleteNotification}
        onCancel={() => setDeleteNotifModal({ isOpen: false, notifId: null })}
      />

      <ConfirmModal
        isOpen={markAllReadModal}
        title="Đánh dấu đọc tất cả"
        message="Bạn có muốn đánh dấu tất cả thông báo là đã đọc?"
        onConfirm={confirmMarkAllRead}
        onCancel={() => setMarkAllReadModal(false)}
      />

      <ConfirmModal
        isOpen={clearAllModal}
        title="Xóa tất cả thông báo"
        message="Bạn có chắc chắn muốn XÓA TOÀN BỘ thông báo?"
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllModal(false)}
      />

      <Footer />
    </>
  );
};

export default PartnerDashboard;
