// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/pages/AdminDashboard.css";

const AdminDashboard = () => {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Modal duyệt tour
  const [approveTourModal, setApproveTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });

  // Modal từ chối tour
  const [rejectTourModal, setRejectTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });

  // Modal xóa tour
  const [deleteTourModal, setDeleteTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });

  // Modal xóa 1 thông báo
  const [deleteNotifModal, setDeleteNotifModal] = useState({
    isOpen: false,
    notifId: null,
  });

  // Modal XÓA TẤT CẢ thông báo
  const [clearAllModal, setClearAllModal] = useState(false);

  // Modal ĐÁNH DẤU ĐỌC TẤT CẢ
  const [markAllReadModal, setMarkAllReadModal] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Placeholder ảnh khi chưa có hoặc lỗi
  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  // Lấy danh sách admin ids từ view (UUID)
  const getAdminIds = async () => {
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/admin_ids_view`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      return data || [];
    } catch (err) {
      console.error("Lỗi lấy danh sách admin từ view:", err);
      return [];
    }
  };

  // Gửi thông báo cho Partner + các Admin khác (trừ chính mình)
  const notifyPartnerAndOtherAdmins = async (
    partnerId,
    tourName,
    tourId,
    messageForPartner,
    typeForPartner,
    messageForAdmin,
    typeForAdmin
  ) => {
    const adminMessage = messageForAdmin.replace("{tourName}", tourName);

    // Gửi cho Partner
    try {
      await axios.post(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        {
          to_partner_id: partnerId,
          from_role: "admin",
          from_id: user.id,
          message: messageForPartner,
          type: typeForPartner,
          tour_id: tourId,
          status: "unread",
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
        }
      );
    } catch (err) {
      console.error("Lỗi gửi thông báo cho Partner:", err);
      toast.warn("Không thể gửi thông báo cho Partner");
    }

    // Gửi cho các Admin khác
    try {
      const admins = await getAdminIds();
      for (const admin of admins) {
        if (admin.admin_id !== user.id) {
          await axios.post(
            `${supabaseUrl}/rest/v1/admin_notifications`,
            {
              to_admin_id: admin.admin_id,
              from_role: "admin",
              from_id: user.id,
              message: adminMessage,
              type: typeForAdmin,
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
      }
    } catch (err) {
      console.error("Lỗi gửi thông báo cho admin khác:", err);
    }
  };

  const fetchAllTours = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingTours(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/tours?select=*,partner_name&order=created_at.desc`,
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
      toast.error("Không thể tải danh sách tour!");
    } finally {
      setLoadingTours(false);
    }
  }, [session?.access_token, supabaseUrl, anonKey]);

  const fetchNotifications = useCallback(async () => {
    if (!session?.access_token || !user?.id) return;
    setLoadingNotifs(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/admin_notifications?to_admin_id=eq.${user.id}&order=created_at.desc`,
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
      toast.error("Không thể tải thông báo!");
    } finally {
      setLoadingNotifs(false);
    }
  }, [session?.access_token, user?.id, supabaseUrl, anonKey]);

  // DUYỆT TOUR
  const openApproveTourModal = (tour) => {
    setApproveTourModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
      partnerId: tour.partner_id,
    });
  };

  const confirmApproveTour = async () => {
    const { tourId, tourName, partnerId } = approveTourModal;
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/tours?id=eq.${tourId}`,
        { status: "APPROVED" },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await notifyPartnerAndOtherAdmins(
        partnerId,
        tourName,
        tourId,
        `Tour "${tourName}" đã được duyệt thành công!`,
        "tour_approved",
        `Admin "${user.full_name}" đã duyệt tour "{tourName}"`,
        "admin_approved_tour"
      );

      toast.success("Đã duyệt tour và gửi thông báo!");
      fetchAllTours();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi duyệt tour:", err);
      toast.error("Không thể duyệt tour!");
    } finally {
      setApproveTourModal({
        isOpen: false,
        tourId: null,
        tourName: "",
        partnerId: null,
      });
    }
  };

  // TỪ CHỐI TOUR
  const openRejectTourModal = (tour) => {
    setRejectTourModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
      partnerId: tour.partner_id,
    });
  };

  const confirmRejectTour = async () => {
    const { tourId, tourName, partnerId } = rejectTourModal;
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/tours?id=eq.${tourId}`,
        { status: "REJECTED" },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await notifyPartnerAndOtherAdmins(
        partnerId,
        tourName,
        tourId,
        `Tour "${tourName}" đã bị từ chối bởi Admin.`,
        "tour_rejected",
        `Admin "${user.full_name}" đã TỪ CHỐI tour "{tourName}"`,
        "admin_rejected_tour"
      );

      toast.success("Đã từ chối tour và gửi thông báo!");
      fetchAllTours();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi từ chối tour:", err);
      toast.error("Không thể từ chối tour!");
    } finally {
      setRejectTourModal({
        isOpen: false,
        tourId: null,
        tourName: "",
        partnerId: null,
      });
    }
  };

  // XÓA TOUR (chỉ khi PAUSED)
  const openDeleteTourModal = (tour) => {
    setDeleteTourModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
      partnerId: tour.partner_id,
    });
  };

  const confirmDeleteTour = async () => {
    const { tourId, tourName, partnerId } = deleteTourModal;
    try {
      await notifyPartnerAndOtherAdmins(
        partnerId,
        tourName,
        tourId,
        `Tour "${tourName}" đã bị Admin XÓA khỏi hệ thống.`,
        "tour_deleted",
        `Admin "${user.full_name}" đã XÓA tour "{tourName}"`,
        "admin_deleted_tour"
      );

      await axios.delete(`${supabaseUrl}/rest/v1/tours?id=eq.${tourId}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      toast.success("Đã xóa tour và gửi thông báo!");
      fetchAllTours();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi xóa tour:", err);
      toast.error("Không thể xóa tour!");
    } finally {
      setDeleteTourModal({
        isOpen: false,
        tourId: null,
        tourName: "",
        partnerId: null,
      });
    }
  };

  // Xử lý thông báo
  const markAsRead = async (notifId) => {
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/admin_notifications?id=eq.${notifId}`,
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
        `${supabaseUrl}/rest/v1/admin_notifications`,
        { status: "read" },
        {
          params: { to_admin_id: `eq.${user.id}`, status: "eq.unread" },
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
      await axios.delete(`${supabaseUrl}/rest/v1/admin_notifications`, {
        params: { to_admin_id: `eq.${user.id}` },
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

  const openDeleteNotifModal = (notifId) => {
    setDeleteNotifModal({ isOpen: true, notifId });
  };

  const confirmDeleteNotification = async () => {
    try {
      await axios.delete(
        `${supabaseUrl}/rest/v1/admin_notifications?id=eq.${deleteNotifModal.notifId}`,
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
    if (activeTab === "tours") fetchAllTours();
    if (activeTab === "notifications") fetchNotifications();
  }, [activeTab, fetchAllTours, fetchNotifications]);

  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

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
        return "Đã duyệt";
      case "REJECTED":
        return "Bị từ chối";
      case "PAUSED":
        return "Tạm dừng";
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
      case "PAUSED":
        return "paused";
      default:
        return "";
    }
  };

  const getNotifTypeText = (type) => {
    switch (type) {
      case "tour_created":
        return "Tour mới được tạo";
      case "tour_paused":
        return "Tour bị tạm dừng";
      case "tour_reactivated":
        return "Tour được kích hoạt lại";
      case "tour_delete_request":
        return "Yêu cầu xóa tour";
      case "tour_approved":
        return "Tour đã được duyệt";
      case "tour_rejected":
        return "Tour bị từ chối";
      case "admin_approved_tour":
        return "Admin đã duyệt tour";
      case "admin_rejected_tour":
        return "Admin đã từ chối tour";
      case "admin_deleted_tour":
        return "Admin đã xóa tour";
      default:
        return "Thông báo hệ thống";
    }
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <>
      <Header />

      <div className="ad2-container">
        <div className="ad2-topbar">
          <div className="ad2-topbar-left">
            <h1 className="ad2-title">Bảng điều khiển Admin</h1>
            <p className="ad2-subtitle">Quản lý tour và thông báo từ Partner</p>
          </div>
        </div>

        <div className="ad2-tabs">
          {[
            { id: "tours", label: "Quản lý Tours" },
            {
              id: "notifications",
              label: `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { id: "orders", label: "Đơn hàng" },
            { id: "users", label: "Người dùng" },
            { id: "partners", label: "Đối tác" },
            { id: "vouchers", label: "Voucher & KM" },
            { id: "reviews", label: "Đánh giá" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`ad2-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ad2-content">
          {activeTab === "tours" && (
            <div className="ad2-table-wrapper">
              <div className="ad2-table-header">
                <h3>Danh sách tất cả Tour ({tours.length})</h3>
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
                <div className="ad2-no-data">
                  <p>Chưa có tour nào được tạo.</p>
                </div>
              ) : (
                <table className="ad2-tours-table">
                  <thead>
                    <tr>
                      <th style={{ width: "110px" }}>Ảnh</th>
                      <th>Tên Tour</th>
                      <th>Tên Partner</th>
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
                        <td className="ad2-tour-image-cell">
                          <img
                            src={tour.image || placeholderImage}
                            alt={tour.name}
                            className="ad2-tour-thumbnail"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = placeholderImage;
                            }}
                          />
                        </td>
                        <td className="ad2-tour-name">{tour.name}</td>
                        <td>
                          <strong>
                            {tour.partner_name || "Chưa xác định"}
                          </strong>
                        </td>
                        <td>{tour.location || "-"}</td>
                        <td>{formatPrice(tour.price)}</td>
                        <td>{tour.duration_days || "-"}</td>
                        <td>
                          <span
                            className={`ad2-status ${getStatusClass(
                              tour.status
                            )}`}
                          >
                            {getStatusText(tour.status)}
                          </span>
                        </td>
                        <td>{formatDate(tour.created_at)}</td>
                        <td className="ad2-actions">
                          {tour.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                className="ad2-btn approve"
                                onClick={() => openApproveTourModal(tour)}
                              >
                                Duyệt
                              </button>
                              <button
                                className="ad2-btn reject"
                                onClick={() => openRejectTourModal(tour)}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {tour.status === "PAUSED" && (
                            <button
                              className="ad2-btn delete"
                              onClick={() => openDeleteTourModal(tour)}
                            >
                              Xóa Tour
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

          {/* Các tab khác giữ nguyên */}
          {activeTab === "notifications" && (
            <div className="ad2-table-wrapper">
              <div className="ad2-table-header">
                <h3>Thông báo từ Partner ({notifications.length})</h3>
                <div className="ad2-notif-actions">
                  <button
                    className="ad2-btn secondary"
                    onClick={openMarkAllReadModal}
                    disabled={unreadCount === 0}
                  >
                    Đánh dấu đọc tất cả
                  </button>
                  <button
                    className="ad2-btn danger"
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
                <div className="ad2-no-data">
                  <p>Chưa có thông báo nào từ Partner.</p>
                </div>
              ) : (
                <div className="ad2-notifications-list">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`ad2-notification-item ${
                        notif.status === "unread" ? "unread" : ""
                      }`}
                    >
                      <div className="ad2-notif-header">
                        <strong>{getNotifTypeText(notif.type)}</strong>
                        <span className="ad2-notif-date">
                          {formatDate(notif.created_at)}
                        </span>
                        <button
                          className="ad2-btn notif-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteNotifModal(notif.id);
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                      <p className="ad2-notif-message">{notif.message}</p>
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

          {["orders", "users", "partners", "vouchers", "reviews"].includes(
            activeTab
          ) && (
            <div className="ad2-table-wrapper">
              <h3>
                {activeTab === "orders" && "Đơn hàng"}
                {activeTab === "users" && "Quản lý người dùng"}
                {activeTab === "partners" && "Quản lý đối tác"}
                {activeTab === "vouchers" && "Voucher & Khuyến mãi"}
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

      {/* Các modal giữ nguyên */}
      <ConfirmModal
        isOpen={approveTourModal.isOpen}
        title="Duyệt tour"
        message={`Bạn có chắc chắn muốn DUYỆT tour "${approveTourModal.tourName}"?`}
        onConfirm={confirmApproveTour}
        onCancel={() =>
          setApproveTourModal({
            isOpen: false,
            tourId: null,
            tourName: "",
            partnerId: null,
          })
        }
      />

      <ConfirmModal
        isOpen={rejectTourModal.isOpen}
        title="Từ chối tour"
        message={`Bạn có chắc chắn muốn TỪ CHỐI tour "${rejectTourModal.tourName}"?`}
        onConfirm={confirmRejectTour}
        onCancel={() =>
          setRejectTourModal({
            isOpen: false,
            tourId: null,
            tourName: "",
            partnerId: null,
          })
        }
      />

      <ConfirmModal
        isOpen={deleteTourModal.isOpen}
        title="Xóa tour"
        message={`Bạn có chắc chắn muốn XÓA tour "${deleteTourModal.tourName}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDeleteTour}
        onCancel={() =>
          setDeleteTourModal({
            isOpen: false,
            tourId: null,
            tourName: "",
            partnerId: null,
          })
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
        message="Bạn có chắc chắn muốn XÓA TOÀN BỘ thông báo của bạn?"
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllModal(false)}
      />

      <Footer />
    </>
  );
};

export default AdminDashboard;
