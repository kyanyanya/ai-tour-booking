// src/pages/PartnerDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CreateTourForm from "../components/forms/CreateTourForm";
import CreateVoucherForm from "../components/forms/CreateVoucherForm";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/pages/PartnerDashboard.css";

const PartnerDashboard = () => {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState("tours");
  const [tours, setTours] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingTours, setLoadingTours] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Form tour
  const [isTourFormOpen, setIsTourFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState(null);

  // Form voucher
  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  // Form tạo ticket
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  // Modal tour
  const [toggleStatusModal, setToggleStatusModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
    currentStatus: "",
  });

  const [deleteTourModal, setDeleteTourModal] = useState({
    isOpen: false,
    tourId: null,
    tourName: "",
  });

  // Modal voucher
  const [deleteVoucherModal, setDeleteVoucherModal] = useState({
    isOpen: false,
    voucherId: null,
    voucherCode: "",
  });

  // Modal thông báo
  const [deleteNotifModal, setDeleteNotifModal] = useState({
    isOpen: false,
    notifId: null,
  });
  const [clearAllModal, setClearAllModal] = useState(false);
  const [markAllReadModal, setMarkAllReadModal] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const placeholderImage =
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  // Gửi thông báo cho tất cả admin
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

      if (!admins || admins.length === 0) return;

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

  // Fetch tours
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

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    setLoadingVouchers(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/vouchers?owner_id=eq.${user.id}&select=*,tours(name,tour_code)&order=created_at.desc`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      setVouchers(data || []);
    } catch (err) {
      console.error("Lỗi tải voucher:", err);
      toast.error("Lỗi khi tải danh sách voucher!");
    } finally {
      setLoadingVouchers(false);
    }
  }, [user?.id, session?.access_token, supabaseUrl, anonKey]);

  // Fetch notifications
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

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    setLoadingTickets(true);
    try {
      const { data } = await axios.get(
        `${supabaseUrl}/rest/v1/support_tickets?partner_id=eq.${user.id}&order=created_at.desc`,
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
  }, [user?.id, session?.access_token, supabaseUrl, anonKey]);

  // ==== TẠO TICKET MỚI – ĐÃ CẬP NHẬT HOÀN CHỈNH ====
  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.warn("Vui lòng nhập tiêu đề và nội dung ticket!");
      return;
    }

    try {
      // Tạo ticket trên Supabase
      await axios.post(
        `${supabaseUrl}/rest/v1/support_tickets`,
        {
          partner_id: user.id,
          partner_name: user.full_name,
          subject: ticketSubject,
          message: ticketMessage,
          status: "open",
        },
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Gửi thông báo cho tất cả admin
      await notifyAllAdmins(
        `Partner "${user.full_name}" đã tạo ticket hỗ trợ mới: "${ticketSubject}"`,
        "support_ticket_created"
      );

      // Gửi thông báo xác nhận cho chính partner
      await axios.post(
        `${supabaseUrl}/rest/v1/partner_notifications`,
        {
          to_partner_id: user.id,
          from_role: "system",
          from_id: user.id,
          message: `Ticket "${ticketSubject}" của bạn đã được gửi thành công !`,
          type: "support_ticket_sent",
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

      toast.success("Gửi ticket hỗ trợ thành công!");

      // Tự động chuyển sang tab Ticket và reload danh sách mới nhất
      setActiveTab("tickets");
      await fetchTickets();

      // Đóng form và reset input
      setIsTicketFormOpen(false);
      setTicketSubject("");
      setTicketMessage("");
    } catch (err) {
      console.error("Lỗi tạo ticket:", err);
      toast.error("Không thể gửi ticket!");
    }
  };

  // Load data theo tab
  useEffect(() => {
    if (activeTab === "tours") fetchTours();
    if (activeTab === "vouchers") fetchVouchers();
    if (activeTab === "notifications") fetchNotifications();
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab, fetchTours, fetchVouchers, fetchNotifications, fetchTickets]);

  // Các handler khác
  const openEditTour = (tour) => {
    setEditingTour(tour);
    setIsTourFormOpen(true);
  };

  const closeTourForm = () => {
    setIsTourFormOpen(false);
    setEditingTour(null);
  };

  const handleTourSuccess = () => {
    fetchTours();
    closeTourForm();
    toast.success(
      editingTour
        ? "Cập nhật tour thành công! Đã gửi yêu cầu duyệt lại đến Admin."
        : "Tạo tour thành công! Đang chờ duyệt."
    );
  };

  const openCreateVoucher = () => {
    setEditingVoucher(null);
    setIsVoucherFormOpen(true);
  };

  const openEditVoucher = (voucher) => {
    setEditingVoucher(voucher);
    setIsVoucherFormOpen(true);
  };

  const closeVoucherForm = () => {
    setIsVoucherFormOpen(false);
    setEditingVoucher(null);
  };

  const handleVoucherSuccess = () => {
    fetchVouchers();
    closeVoucherForm();
    toast.success(
      editingVoucher
        ? "Cập nhật voucher thành công!"
        : "Tạo voucher thành công!"
    );
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
    } catch {
      toast.error("Không thể thay đổi trạng thái tour!");
    } finally {
      setToggleStatusModal({ isOpen: false });
    }
  };

  const openDeleteTourModal = (tour) => {
    setDeleteTourModal({
      isOpen: true,
      tourId: tour.id,
      tourName: tour.name,
    });
  };

  const confirmDeleteTour = async () => {
    const { tourId, tourName } = deleteTourModal;
    try {
      await axios.delete(`${supabaseUrl}/rest/v1/tours?id=eq.${tourId}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      toast.success(`Đã xóa tour "${tourName}" thành công!`);
      fetchTours();
    } catch {
      toast.error("Không thể xóa tour!");
    } finally {
      setDeleteTourModal({ isOpen: false });
    }
  };

  const openDeleteVoucherModal = (voucher) => {
    setDeleteVoucherModal({
      isOpen: true,
      voucherId: voucher.id,
      voucherCode: voucher.code,
    });
  };

  const confirmDeleteVoucher = async () => {
    const { voucherId, voucherCode } = deleteVoucherModal;
    try {
      await axios.delete(`${supabaseUrl}/rest/v1/vouchers?id=eq.${voucherId}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      toast.success(`Đã xóa voucher "${voucherCode}" thành công!`);
      fetchVouchers();
    } catch {
      toast.error("Không thể xóa voucher!");
    } finally {
      setDeleteVoucherModal({ isOpen: false });
    }
  };

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
    if (unreadCount === 0)
      return toast.info("Không có thông báo nào chưa đọc!");
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
    } catch {
      toast.error("Không thể đánh dấu tất cả!");
    } finally {
      setMarkAllReadModal(false);
    }
  };

  const openClearAllModal = () => {
    if (notifications.length === 0)
      return toast.info("Không có thông báo nào để xóa!");
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
    } catch {
      toast.error("Không thể xóa tất cả thông báo!");
    } finally {
      setClearAllModal(false);
    }
  };

  const openDeleteNotifModal = (notifId) =>
    setDeleteNotifModal({ isOpen: true, notifId });

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
    } catch {
      toast.error("Không thể xóa thông báo!");
    } finally {
      setDeleteNotifModal({ isOpen: false, notifId: null });
    }
  };

  if (!user || user.role !== "partner") return <Navigate to="/login" replace />;

  const formatPrice = (price) =>
    price ? Number(price).toLocaleString("vi-VN") + "đ" : "-";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

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

  const getTicketStatusText = (status) => {
    switch (status) {
      case "open":
        return "Mới";
      case "in_progress":
        return "Đang xử lý";
      case "resolved":
        return "Đã giải quyết";
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
      case "tour_approved":
        return "Tour được duyệt";
      case "tour_rejected":
        return "Tour bị từ chối";
      case "tour_deleted":
        return "Tour đã bị xóa";
      case "support_ticket_sent":
        return "Ticket đã gửi";
      case "support_ticket_in_progress":
        return "Ticket đang được xử lý";
      case "support_ticket_rejected":
        return "Ticket bị từ chối";
      default:
        return "Thông báo hệ thống";
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
            <p className="pd-subtitle">
              Quản lý tours, voucher, ticket và thông báo
            </p>
          </div>
          <div className="pd-topbar-right">
            {activeTab === "tours" && (
              <button
                className="pd-btn-create"
                onClick={() => setIsTourFormOpen(true)}
              >
                + Tạo tour mới
              </button>
            )}
            {activeTab === "vouchers" && (
              <button className="pd-btn-create" onClick={openCreateVoucher}>
                + Tạo voucher mới
              </button>
            )}
            {activeTab === "tickets" && (
              <button
                className="pd-btn-create"
                onClick={() => setIsTicketFormOpen(true)}
              >
                + Tạo ticket mới
              </button>
            )}
          </div>
        </div>

        {/* Tabs – ĐÃ BỎ TAB "Phân tích" */}
        <div className="pd-tabs">
          {[
            { id: "overview", label: "Tổng quan" },
            { id: "tours", label: "Tour của bạn" },
            { id: "vouchers", label: "Voucher" },
            {
              id: "notifications",
              label: `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
            },
            { id: "tickets", label: "Ticket hỗ trợ" },
            { id: "orders", label: "Đơn hàng" },
            { id: "recentBookings", label: "Đặt chỗ gần đây" },
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
          {/* TAB TOURS */}
          {activeTab === "tours" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Danh sách Tour của bạn ({tours.length})</h3>
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
                      <th style={{ width: "100px" }}>Ảnh</th>
                      <th>Mã Tour</th>
                      <th>Tên Tour</th>
                      <th>Địa điểm</th>
                      <th>Giá</th>
                      <th>Số ngày</th>
                      <th>Số đêm</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tours.map((tour) => (
                      <tr key={tour.id}>
                        <td className="pd-tour-image-cell">
                          <img
                            src={tour.image || placeholderImage}
                            alt={tour.name}
                            className="pd-tour-thumbnail"
                            loading="lazy"
                            onError={(e) =>
                              (e.currentTarget.src = placeholderImage)
                            }
                          />
                        </td>
                        <td>
                          <strong>{tour.tour_code || "-"}</strong>
                        </td>
                        <td className="pd-tour-name">{tour.name}</td>
                        <td>{tour.location || "-"}</td>
                        <td>{formatPrice(tour.price)}</td>
                        <td>{tour.duration_days || "-"}</td>
                        <td>{tour.duration_nights || "-"}</td>
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
                          <button
                            className="pd-btn edit"
                            onClick={() => openEditTour(tour)}
                          >
                            Sửa
                          </button>
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
                          {tour.status === "REJECTED" && (
                            <button
                              className="pd-btn delete"
                              onClick={() => openDeleteTourModal(tour)}
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

          {/* TAB VOUCHERS */}
          {activeTab === "vouchers" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Danh sách Voucher ({vouchers.length})</h3>
              </div>

              {loadingVouchers ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color: "#666",
                  }}
                >
                  Đang tải voucher...
                </div>
              ) : vouchers.length === 0 ? (
                <div className="pd-no-data">
                  <p>Chưa có voucher nào.</p>
                  <p>Nhấn "Tạo voucher mới" để bắt đầu!</p>
                </div>
              ) : (
                <table className="pd-tours-table">
                  <thead>
                    <tr>
                      <th>Mã Voucher</th>
                      <th>Giảm giá</th>
                      <th>Áp dụng cho</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th>Số lượng</th>
                      <th>Đã dùng</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => {
                      const tourName = voucher.tours?.name || null;
                      const tourCode = voucher.tours?.tour_code || null;
                      const maxUses = voucher.max_uses || "Không giới hạn";
                      const currentUses = voucher.current_uses || 0;
                      const usesText = voucher.max_uses
                        ? `${currentUses}/${voucher.max_uses}`
                        : `${currentUses} (không giới hạn)`;

                      return (
                        <tr key={voucher.id}>
                          <td>
                            <strong>{voucher.code}</strong>
                          </td>
                          <td>{formatPrice(voucher.discount_amount)}</td>
                          <td>
                            {voucher.tour_id
                              ? tourCode
                                ? `[${tourCode}] ${tourName}`
                                : tourName || "Tour cụ thể"
                              : "Tất cả tour"}
                          </td>
                          <td>{formatDate(voucher.start_date)}</td>
                          <td>{formatDate(voucher.expires_at)}</td>
                          <td>{maxUses}</td>
                          <td>{usesText}</td>
                          <td>{formatDate(voucher.created_at)}</td>
                          <td className="pd-actions">
                            <button
                              className="pd-btn edit"
                              onClick={() => openEditVoucher(voucher)}
                            >
                              Sửa
                            </button>
                            <button
                              className="pd-btn delete"
                              onClick={() => openDeleteVoucherModal(voucher)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB NOTIFICATIONS */}
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

          {/* TAB TICKETS */}
          {activeTab === "tickets" && (
            <div className="pd-table-wrapper">
              <div className="pd-table-header">
                <h3>Ticket hỗ trợ của bạn ({tickets.length})</h3>
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
                <div className="pd-no-data">
                  <p>Bạn chưa tạo ticket hỗ trợ nào.</p>
                  <p>Nhấn nút "+ Tạo ticket mới" khi cần hỗ trợ từ Admin.</p>
                </div>
              ) : (
                <div className="pd-notifications-list">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`pd-notification-item ${
                        ticket.status === "open" ? "unread" : ""
                      }`}
                    >
                      <div className="pd-notif-header">
                        <strong>{ticket.subject}</strong>
                        <span className="pd-notif-date">
                          {formatDate(ticket.created_at)}
                        </span>
                        <span
                          className={`pd-status ${getTicketStatusClass(
                            ticket.status
                          )}`}
                          style={{ marginLeft: "12px", fontSize: "0.8rem" }}
                        >
                          {getTicketStatusText(ticket.status)}
                        </span>
                      </div>
                      <p className="pd-notif-message">{ticket.message}</p>
                      {ticket.assigned_admin_name && (
                        <small
                          style={{
                            color: "#666",
                            display: "block",
                            marginTop: "8px",
                          }}
                        >
                          Được xử lý bởi:{" "}
                          <strong>{ticket.assigned_admin_name}</strong>
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Các tab placeholder – không có "analytics" */}
          {[
            "overview",
            "orders",
            "recentBookings",
            "payments",
            "reviews",
          ].includes(activeTab) && (
            <div className="pd-table-wrapper">
              <h3>
                {activeTab === "overview" && "Tổng quan"}
                {activeTab === "orders" && "Đơn hàng"}
                {activeTab === "recentBookings" && "Đặt chỗ gần đây"}
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

      {/* Các form và modal */}
      {isTourFormOpen && (
        <div className="modal-backdrop" onClick={closeTourForm}>
          <div onClick={(e) => e.stopPropagation()}>
            <CreateTourForm
              tour={editingTour}
              onClose={closeTourForm}
              onSuccess={handleTourSuccess}
            />
          </div>
        </div>
      )}

      {isVoucherFormOpen && (
        <div className="modal-backdrop" onClick={closeVoucherForm}>
          <div onClick={(e) => e.stopPropagation()}>
            <CreateVoucherForm
              voucher={editingVoucher}
              partnerId={user.id}
              onClose={closeVoucherForm}
              onSuccess={handleVoucherSuccess}
            />
          </div>
        </div>
      )}

      {isTicketFormOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsTicketFormOpen(false)}
        >
          <div
            className="pd-table-wrapper"
            style={{ width: "600px", maxWidth: "95%", padding: "32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "24px" }}>
              Tạo ticket hỗ trợ mới
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Tiêu đề ticket
              </label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Ví dụ: Lỗi không thể tạo voucher, thanh toán bị lỗi..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Nội dung chi tiết
              </label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows="8"
                placeholder="Mô tả rõ ràng vấn đề bạn đang gặp phải, càng chi tiết càng tốt..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  resize: "vertical",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="pd-btn secondary"
                style={{ padding: "10px 20px" }}
                onClick={() => {
                  setIsTicketFormOpen(false);
                  setTicketSubject("");
                  setTicketMessage("");
                }}
              >
                Hủy
              </button>
              <button
                className="pd-btn-create"
                style={{ padding: "10px 20px" }}
                onClick={handleCreateTicket}
              >
                Gửi ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Các ConfirmModal */}
      <ConfirmModal
        isOpen={toggleStatusModal.isOpen}
        title="Xác nhận thay đổi trạng thái"
        message={`Bạn có chắc muốn ${
          toggleStatusModal.currentStatus === "APPROVED"
            ? "TẠM DỪNG"
            : "KÍCH HOẠT LẠI"
        } tour "${toggleStatusModal.tourName}"?`}
        onConfirm={confirmToggleStatus}
        onCancel={() => setToggleStatusModal({ isOpen: false })}
      />

      <ConfirmModal
        isOpen={deleteTourModal.isOpen}
        title="Xóa tour"
        message={`Bạn có chắc chắn muốn XÓA tour "${deleteTourModal.tourName}"? Hành động này không thể hoàn tác.`}
        onConfirm={confirmDeleteTour}
        onCancel={() => setDeleteTourModal({ isOpen: false })}
      />

      <ConfirmModal
        isOpen={deleteVoucherModal.isOpen}
        title="Xóa voucher"
        message={`Bạn có chắc muốn xóa voucher "${deleteVoucherModal.voucherCode}"?`}
        onConfirm={confirmDeleteVoucher}
        onCancel={() => setDeleteVoucherModal({ isOpen: false })}
      />

      <ConfirmModal
        isOpen={deleteNotifModal.isOpen}
        title="Xóa thông báo"
        message="Bạn có chắc muốn xóa thông báo này?"
        onConfirm={confirmDeleteNotification}
        onCancel={() => setDeleteNotifModal({ isOpen: false })}
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
