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
  const [tickets, setTickets] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Modal duyệt/reject tour
  const [approveTourModal, setApproveTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });
  const [rejectTourModal, setRejectTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });
  const [deleteTourModal, setDeleteTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    partnerId: null,
  });

  // Modal thông báo
  const [deleteNotifModal, setDeleteNotifModal] = useState({
    isOpen: false,
    notifId: null,
  });
  const [clearAllModal, setClearAllModal] = useState(false);
  const [markAllReadModal, setMarkAllReadModal] = useState(false);

  // Modal xử lý ticket (Nhận xử lý / Từ chối / Hoàn thành)
  const [handleTicketModal, setHandleTicketModal] = useState({
    isOpen: false,
    ticketId: null,
    subject: "",
    partnerId: null,
    action: "", // "accept", "reject", "resolve"
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  // Lấy danh sách admin ids từ view
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

    if (messageForPartner && partnerId) {
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
            },
          }
        );
      } catch (err) {
        console.error("Lỗi gửi thông báo cho Partner:", err);
      }
    }

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

  const fetchTickets = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingTickets(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/support_tickets?order=created_at.desc`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setTickets(data || []);
    } catch (err) {
      console.error("Lỗi tải ticket:", err);
      toast.error("Không thể tải danh sách ticket!");
    } finally {
      setLoadingTickets(false);
    }
  }, [session?.access_token, supabaseUrl, anonKey]);

  // Xử lý ticket: Nhận xử lý
  const handleAcceptTicket = async () => {
    const { ticketId, subject, partnerId } = handleTicketModal;
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/support_tickets?id=eq.${ticketId}`,
        {
          status: "in_progress",
          assigned_admin_id: user.id,
          assigned_admin_name: user.full_name,
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await axios.post(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        {
          to_partner_id: partnerId,
          from_role: "admin",
          from_id: user.id,
          message: `Admin "${user.full_name}" đã nhận xử lý ticket: "${subject}"`,
          type: "support_ticket_in_progress",
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

      await notifyPartnerAndOtherAdmins(
        partnerId,
        subject,
        null,
        "",
        "",
        `Admin "${user.full_name}" đã nhận xử lý ticket: "${subject}"`,
        "admin_accepted_ticket"
      );

      toast.success("Đã nhận xử lý ticket!");
      fetchTickets();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi nhận xử lý ticket:", err);
      toast.error("Không thể nhận xử lý ticket!");
    } finally {
      setHandleTicketModal({ isOpen: false });
    }
  };

  // Xử lý ticket: Từ chối
  const handleRejectTicket = async () => {
    const { ticketId, subject, partnerId } = handleTicketModal;
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/support_tickets?id=eq.${ticketId}`,
        {
          status: "rejected",
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await axios.post(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        {
          to_partner_id: partnerId,
          from_role: "admin",
          from_id: user.id,
          message: `Ticket "${subject}" của bạn đã bị từ chối xử lý.`,
          type: "support_ticket_rejected",
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

      toast.success("Đã từ chối ticket!");
      fetchTickets();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi từ chối ticket:", err);
      toast.error("Không thể từ chối ticket!");
    } finally {
      setHandleTicketModal({ isOpen: false });
    }
  };

  // Xử lý ticket: Hoàn thành
  const handleResolveTicket = async () => {
    const { ticketId, subject, partnerId } = handleTicketModal;
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/support_tickets?id=eq.${ticketId}`,
        {
          status: "resolved",
          closed_at: new Date().toISOString(),
          closed_by: user.id,
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      await axios.post(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        {
          to_partner_id: partnerId,
          from_role: "admin",
          from_id: user.id,
          message: `Ticket "${subject}" của bạn đã được HOÀN THÀNH bởi Admin "${user.full_name}". Cảm ơn bạn đã chờ!`,
          type: "support_ticket_resolved",
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

      toast.success("Ticket đã được hoàn thành!");
      fetchTickets();
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi hoàn thành ticket:", err);
      toast.error("Không thể hoàn thành ticket!");
    } finally {
      setHandleTicketModal({ isOpen: false });
    }
  };

  // Các hàm xử lý tour
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
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab, fetchAllTours, fetchNotifications, fetchTickets]);

  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTicketStatusText = (status) => {
    switch (status) {
      case "open":
        return "Mới";
      case "in_progress":
        return "Đang xử lý";
      case "resolved":
        return "Đã hoàn thành";
      case "rejected":
        return "Bị từ chối";
      default:
        return status;
    }
  };

  const getTicketStatusClass = (status) => {
    switch (status) {
      case "open":
        return "pending";
      case "in_progress":
        return "confirmed";
      case "resolved":
        return "confirmed";
      case "rejected":
        return "cancelled";
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
      case "admin_approved_tour":
        return "Admin đã duyệt tour";
      case "admin_rejected_tour":
        return "Admin đã từ chối tour";
      case "admin_deleted_tour":
        return "Admin đã xóa tour";
      case "support_ticket_created":
        return "Ticket hỗ trợ mới";
      case "admin_accepted_ticket":
        return "Admin nhận xử lý ticket";
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
            <p className="ad2-subtitle">
              Quản lý tour, ticket và thông báo từ Partner
            </p>
          </div>
        </div>

        <div className="ad2-tabs">
          {[
            { id: "tours", label: "Quản lý Tours" },
            {
              id: "notifications",
              label: `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { id: "tickets", label: "Ticket hỗ trợ" },
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
          {/* TAB TOURS */}
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
                        <td>
                          {tour.price
                            ? tour.price.toLocaleString("vi-VN") + "đ"
                            : "-"}
                        </td>
                        <td>{tour.duration_days || "-"}</td>
                        <td>
                          <span
                            className={`ad2-status ${
                              tour.status === "PENDING_APPROVAL"
                                ? "pending"
                                : tour.status === "APPROVED"
                                ? "confirmed"
                                : tour.status === "REJECTED"
                                ? "cancelled"
                                : "paused"
                            }`}
                          >
                            {tour.status === "PENDING_APPROVAL"
                              ? "Chờ duyệt"
                              : tour.status === "APPROVED"
                              ? "Đã duyệt"
                              : tour.status === "REJECTED"
                              ? "Bị từ chối"
                              : "Tạm dừng"}
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

          {/* TAB NOTIFICATIONS */}
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

          {/* TAB TICKETS – ĐÃ CẬP NHẬT HOÀN CHỈNH NHẤT */}
          {activeTab === "tickets" && (
            <div className="ad2-table-wrapper">
              <div className="ad2-table-header">
                <h3>Danh sách Ticket hỗ trợ ({tickets.length})</h3>
              </div>

              {loadingTickets ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải ticket...
                </div>
              ) : tickets.length === 0 ? (
                <div className="ad2-no-data">
                  <p>Chưa có ticket hỗ trợ nào từ Partner.</p>
                </div>
              ) : (
                <div className="ad2-notifications-list">
                  {tickets.map((ticket) => {
                    // Kiểm tra xem admin hiện tại có phải là người đang xử lý không
                    const isCurrentUserHandling =
                      ticket.assigned_admin_id === user.id;

                    // Tên người xử lý cuối cùng
                    const handlerName =
                      ticket.status === "resolved"
                        ? ticket.closed_by === user.id
                          ? user.full_name
                          : ticket.assigned_admin_name || "Admin khác"
                        : ticket.assigned_admin_name;

                    return (
                      <div
                        key={ticket.id}
                        className={`ad2-notification-item ${
                          ticket.status === "open" ? "unread" : ""
                        }`}
                      >
                        <div className="ad2-notif-header">
                          <strong>{ticket.subject}</strong>
                          <span className="ad2-notif-date">
                            {formatDate(ticket.created_at)}
                          </span>
                          <span
                            className={`ad2-status ${getTicketStatusClass(
                              ticket.status
                            )}`}
                            style={{ marginLeft: "12px" }}
                          >
                            {getTicketStatusText(ticket.status)}
                          </span>
                        </div>
                        <p className="ad2-notif-message">
                          <strong>Partner:</strong>{" "}
                          {ticket.partner_name || "Không rõ"}
                          <br />
                          {ticket.message}
                        </p>

                        {/* Hiển thị trạng thái xử lý */}
                        {ticket.status === "in_progress" && handlerName && (
                          <small
                            style={{
                              display: "block",
                              marginTop: "8px",
                              color: "#666",
                            }}
                          >
                            Đang xử lý bởi: <strong>{handlerName}</strong>
                          </small>
                        )}

                        {ticket.status === "resolved" && handlerName && (
                          <small
                            style={{
                              display: "block",
                              marginTop: "8px",
                              color: "#10b981",
                              fontWeight: "600",
                            }}
                          >
                            Đã hoàn thành bởi: <strong>{handlerName}</strong>
                          </small>
                        )}

                        {/* NÚT HÀNH ĐỘNG */}
                        <div
                          style={{
                            marginTop: "12px",
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {ticket.status === "open" && (
                            <>
                              <button
                                className="ad2-btn approve"
                                onClick={() =>
                                  setHandleTicketModal({
                                    isOpen: true,
                                    ticketId: ticket.id,
                                    subject: ticket.subject,
                                    partnerId: ticket.partner_id,
                                    action: "accept",
                                  })
                                }
                              >
                                Nhận xử lý
                              </button>
                              <button
                                className="ad2-btn reject"
                                onClick={() =>
                                  setHandleTicketModal({
                                    isOpen: true,
                                    ticketId: ticket.id,
                                    subject: ticket.subject,
                                    partnerId: ticket.partner_id,
                                    action: "reject",
                                  })
                                }
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {/* Chỉ hiện nút Hoàn thành nếu chính admin này đang xử lý */}
                          {ticket.status === "in_progress" &&
                            isCurrentUserHandling && (
                              <button
                                className="ad2-btn approve"
                                style={{ background: "#059669" }}
                                onClick={() =>
                                  setHandleTicketModal({
                                    isOpen: true,
                                    ticketId: ticket.id,
                                    subject: ticket.subject,
                                    partnerId: ticket.partner_id,
                                    action: "resolve",
                                  })
                                }
                              >
                                Hoàn thành
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Các tab placeholder */}
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

      {/* Các modal */}
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

      {/* Modal xử lý ticket */}
      <ConfirmModal
        isOpen={handleTicketModal.isOpen}
        title={
          handleTicketModal.action === "accept"
            ? "Nhận xử lý ticket"
            : handleTicketModal.action === "reject"
            ? "Từ chối ticket"
            : "Hoàn thành ticket"
        }
        message={
          handleTicketModal.action === "accept"
            ? `Bạn có chắc muốn NHẬN XỬ LÝ ticket "${handleTicketModal.subject}"?`
            : handleTicketModal.action === "reject"
            ? `Bạn có chắc muốn TỪ CHỐI ticket "${handleTicketModal.subject}"?`
            : `Bạn có chắc muốn HOÀN THÀNH ticket "${handleTicketModal.subject}"?`
        }
        onConfirm={
          handleTicketModal.action === "accept"
            ? handleAcceptTicket
            : handleTicketModal.action === "reject"
            ? handleRejectTicket
            : handleResolveTicket
        }
        onCancel={() => setHandleTicketModal({ isOpen: false })}
      />

      <Footer />
    </>
  );
};

export default AdminDashboard;
