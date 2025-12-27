/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/VoucherPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import "../styles/pages/VoucherPage.css";

const VoucherPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState({}); // { voucherId: true }

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");
  const userId = user?.id || localStorage.getItem("userId");

  // Lấy danh sách voucher
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const { data } = await axios.get(
          `${SUPABASE_URL}/rest/v1/vouchers?select=*,tours(name,tour_code)&order=created_at.desc`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        const now = new Date();
        const validVouchers = data.filter((v) => {
          if (v.start_date && new Date(v.start_date) > now) return false;
          if (v.expires_at && new Date(v.expires_at) < now) return false;
          if (v.total_issued && v.claimed_count >= v.total_issued) return false;
          return true;
        });

        setVouchers(validVouchers);
      } catch (err) {
        console.error("Lỗi tải voucher:", err);
        toast.error("Không thể tải danh sách voucher.");
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  // Lấy điểm hiện tại của user
  useEffect(() => {
    if (user && userId && accessToken) {
      const fetchUserPoints = async () => {
        try {
          const { data } = await axios.get(
            `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=reward_points`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (data && data[0]) {
            setUserPoints(data[0].reward_points || 0);
          }
        } catch (err) {
          console.error("Lỗi lấy điểm người dùng:", err);
        }
      };
      fetchUserPoints();
    }
  }, [user, userId, accessToken]);

  // Xử lý nhận/mua voucher
  const handleClaimVoucher = async (voucher) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để nhận/mua voucher!");
      navigate("/login");
      return;
    }

    // Kiểm tra đã nhận/mua chưa (dữ liệu local)
    if (voucher.claimed_by?.includes(userId)) {
      toast.info("Bạn đã nhận hoặc mua voucher này rồi!");
      return;
    }

    const pointCost = voucher.point_cost || 0;

    // Kiểm tra đủ điểm chưa
    if (pointCost > 0 && userPoints < pointCost) {
      toast.error(
        `Không đủ điểm! Cần ${pointCost} điểm, bạn đang có ${userPoints} điểm.`
      );
      return;
    }

    setClaiming((prev) => ({ ...prev, [voucher.id]: true }));

    try {
      // Gọi RPC để claim voucher và trừ điểm (nếu có)
      await axios.post(
        `${SUPABASE_URL}/rest/v1/rpc/claim_voucher`,
        {
          p_voucher_id: voucher.id,
          p_user_id: userId,
          p_point_cost: pointCost,
        },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
        }
      );

      // Thành công
      toast.success(
        pointCost > 0
          ? `Đã mua thành công voucher ${voucher.code}! Đã trừ ${pointCost} điểm.`
          : `Nhận thành công voucher ${voucher.code} miễn phí!`
      );

      // Cập nhật UI
      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id));

      // Cập nhật điểm hiển thị ngay lập tức (vì backend đã trừ)
      if (pointCost > 0) {
        setUserPoints((prev) => prev - pointCost);
      }
    } catch (err) {
      console.error("Lỗi khi claim voucher:", err);
      const msg = err.response?.data?.message || "Lỗi không xác định";

      if (msg.includes("Không đủ điểm")) {
        toast.error("Không đủ điểm để mua voucher!");
      } else if (msg.includes("đã nhận") || msg.includes("đã mua")) {
        toast.info("Bạn đã nhận/mua voucher này rồi!");
      } else if (msg.includes("hết lượt")) {
        toast.error("Voucher đã hết lượt!");
      } else {
        toast.error("Không thể nhận/mua voucher. Vui lòng thử lại!");
      }
    } finally {
      setClaiming((prev) => ({ ...prev, [voucher.id]: false }));
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDate = (date) =>
    !date
      ? "Không giới hạn"
      : new Date(date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

  return (
    <>
      <Header />
      <div className="voucher-page-container">
        <div className="voucher-page-wrapper">
          <h1 className="voucher-page-title">Mã Giảm Giá & Ưu Đãi</h1>

          {/* Hiển thị điểm hiện tại */}
          {user && (
            <div className="user-points-display">
              <strong>Điểm của bạn:</strong>{" "}
              <span className="points-value">
                {userPoints.toLocaleString()} điểm
              </span>
            </div>
          )}

          <p className="voucher-page-subtitle">
            {user
              ? "Nhận voucher miễn phí hoặc dùng điểm để mua voucher đặc biệt!"
              : "Đăng nhập để nhận ưu đãi!"}
          </p>

          {loading ? (
            <div className="voucher-loading">Đang tải voucher...</div>
          ) : vouchers.length === 0 ? (
            <div className="voucher-no-data">
              <p>Hiện tại chưa có voucher nào khả dụng.</p>
              <p>Hãy quay lại sau nhé!</p>
            </div>
          ) : (
            <div className="voucher-grid">
              {vouchers.map((voucher) => {
                const pointCost = voucher.point_cost || 0;
                const isFree = pointCost === 0;
                const hasEnoughPoints = userPoints >= pointCost;
                const alreadyClaimed = voucher.claimed_by?.includes(userId);
                const isClaiming = claiming[voucher.id];

                const isDisabled =
                  isClaiming ||
                  alreadyClaimed ||
                  (pointCost > 0 && !hasEnoughPoints);

                const remaining = voucher.total_issued
                  ? voucher.total_issued - (voucher.claimed_count || 0)
                  : null;

                return (
                  <div key={voucher.id} className="voucher-card">
                    <div className="voucher-header">
                      <h3>{voucher.code}</h3>
                      <span className="voucher-discount">
                        Giảm {formatPrice(voucher.discount_amount)}
                      </span>
                    </div>

                    <div className="voucher-body">
                      <p>
                        <strong>Chi phí:</strong>{" "}
                        {isFree ? (
                          <span style={{ color: "#27ae60", fontWeight: "700" }}>
                            Miễn phí
                          </span>
                        ) : (
                          <span
                            style={{
                              color: hasEnoughPoints ? "#e67e22" : "#e74c3c",
                              fontWeight: "700",
                            }}
                          >
                            {pointCost} điểm {!hasEnoughPoints && "(không đủ)"}
                          </span>
                        )}
                      </p>

                      {voucher.tour_id ? (
                        <p>
                          <strong>Áp dụng:</strong>{" "}
                          {voucher.tours?.tour_code
                            ? `[${voucher.tours.tour_code}] `
                            : ""}
                          {voucher.tours?.name || "Tour cụ thể"}
                        </p>
                      ) : (
                        <p>
                          <strong>Áp dụng:</strong> Tất cả tour
                        </p>
                      )}

                      <p>
                        <strong>Hiệu lực từ:</strong>{" "}
                        {formatDate(voucher.start_date)}
                      </p>
                      <p>
                        <strong>Hết hạn:</strong>{" "}
                        {formatDate(voucher.expires_at)}
                      </p>

                      {remaining !== null && (
                        <p>
                          <strong>Số lượng còn lại:</strong>{" "}
                          <span
                            className={
                              remaining <= 5 ? "voucher-low-stock" : ""
                            }
                          >
                            {remaining}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="voucher-footer">
                      <button
                        className="voucher-claim-btn"
                        onClick={() => handleClaimVoucher(voucher)}
                        disabled={isDisabled}
                      >
                        {isClaiming
                          ? "Đang xử lý..."
                          : alreadyClaimed
                          ? "Đã nhận/mua"
                          : isFree
                          ? "Nhận miễn phí"
                          : hasEnoughPoints
                          ? "Mua bằng điểm"
                          : "Không đủ điểm"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VoucherPage;
