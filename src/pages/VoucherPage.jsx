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
  const [claiming, setClaiming] = useState({});

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");
  const userId = user?.id || localStorage.getItem("userId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Lấy tất cả voucher (giữ nguyên query cũ)
        const voucherRes = await axios.get(
          `${SUPABASE_URL}/rest/v1/vouchers?select=*,tours(name,tour_code)&order=created_at.desc`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        const now = new Date();
        const validVouchers = voucherRes.data.filter((v) => {
          if (v.start_date && new Date(v.start_date) > now) return false;
          if (v.expires_at && new Date(v.expires_at) < now) return false;
          if (v.total_issued && v.claimed_count >= v.total_issued) return false;
          return true;
        });

        // 2. Lấy tên owner nếu có owner_id
        const ownerIds = [
          ...new Set(validVouchers.map((v) => v.owner_id).filter(Boolean)),
        ];

        let ownerNames = {};
        if (ownerIds.length > 0) {
          const usersRes = await axios.get(
            `${SUPABASE_URL}/rest/v1/users?user_id=in.(${ownerIds.join(
              ","
            )})&select=user_id,full_name`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );

          usersRes.data.forEach((u) => {
            ownerNames[u.user_id] = u.full_name || "Không xác định";
          });
        }

        // 3. Gắn tên vào voucher
        const enrichedVouchers = validVouchers.map((voucher) => ({
          ...voucher,
          owner_full_name: ownerNames[voucher.owner_id] || null,
        }));

        setVouchers(enrichedVouchers);
      } catch (err) {
        console.error(
          "Lỗi khi tải dữ liệu:",
          err.response?.data || err.message
        );
        toast.error("Không thể tải voucher. Vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lấy điểm user (giữ nguyên)
  useEffect(() => {
    if (!user || !userId || !accessToken) return;

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
        setUserPoints(data?.[0]?.reward_points || 0);
      } catch (err) {
        console.error("Lỗi lấy điểm:", err);
      }
    };
    fetchUserPoints();
  }, [user, userId, accessToken]);

  // Xử lý claim voucher (giữ nguyên, chỉ copy phần cần thiết)
  const handleClaimVoucher = async (voucher) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập!");
      navigate("/login");
      return;
    }

    if (voucher.claimed_by?.includes(userId)) {
      toast.info("Bạn đã nhận/mua voucher này rồi!");
      return;
    }

    const pointCost = voucher.point_cost || 0;
    if (pointCost > 0 && userPoints < pointCost) {
      toast.error(`Không đủ điểm! Cần ${pointCost}, bạn có ${userPoints}`);
      return;
    }

    setClaiming((prev) => ({ ...prev, [voucher.id]: true }));

    try {
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

      toast.success(
        pointCost > 0
          ? `Mua thành công! Đã trừ ${pointCost} điểm.`
          : `Nhận miễn phí thành công!`
      );

      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id));
      if (pointCost > 0) setUserPoints((prev) => prev - pointCost);
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("Không đủ điểm")) toast.error("Không đủ điểm!");
      else if (msg.includes("đã nhận") || msg.includes("đã mua"))
        toast.info("Đã nhận/mua rồi!");
      else if (msg.includes("hết lượt")) toast.error("Hết voucher!");
      else toast.error("Lỗi xảy ra, thử lại sau!");
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
              ? "Nhận voucher miễn phí hoặc dùng điểm để mua!"
              : "Đăng nhập để nhận ưu đãi!"}
          </p>

          {loading ? (
            <div className="voucher-loading">Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div className="voucher-no-data">
              <p>Chưa có voucher nào khả dụng.</p>
            </div>
          ) : (
            <div className="voucher-grid">
              {vouchers.map((voucher) => {
                const pointCost = voucher.point_cost || 0;
                const isFree = pointCost === 0;
                const hasEnough = userPoints >= pointCost;
                const claimed = voucher.claimed_by?.includes(userId);
                const claimingNow = claiming[voucher.id];

                const disabled =
                  claimingNow || claimed || (!isFree && !hasEnough);

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
                          <span style={{ color: "#27ae60" }}>Miễn phí</span>
                        ) : (
                          `${pointCost} điểm ${!hasEnough ? "(không đủ)" : ""}`
                        )}
                      </p>

                      <p>
                        <strong>Áp dụng:</strong>{" "}
                        {voucher.tour_id
                          ? voucher.tours?.name || "Tour cụ thể"
                          : "Tất cả tour"}
                      </p>

                      {voucher.owner_full_name ? (
                        <p>
                          <strong>Đối tác tạo:</strong>{" "}
                          <span style={{ color: "#4361ee", fontWeight: 600 }}>
                            {voucher.owner_full_name}
                          </span>
                        </p>
                      ) : (
                        <p>
                          <strong>Đối tác tạo:</strong> Hệ thống
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
                          <strong>Còn lại:</strong>{" "}
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
                        disabled={disabled}
                      >
                        {claimingNow
                          ? "Đang xử lý..."
                          : claimed
                          ? "Đã nhận"
                          : isFree
                          ? "Nhận miễn phí"
                          : hasEnough
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
