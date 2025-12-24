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
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState({});

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const accessToken = localStorage.getItem("accessToken");
  const userId = user?.id || localStorage.getItem("userId");

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaimVoucher = async (voucher) => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để nhận voucher!");
      navigate("/login");
      return;
    }

    setClaiming((prev) => ({ ...prev, [voucher.id]: true }));

    try {
      // Lấy voucher_codes hiện tại của user
      const { data: userData } = await axios.get(
        `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}&select=voucher_codes`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const currentCodes = userData[0]?.voucher_codes || [];

      if (currentCodes.includes(voucher.code)) {
        toast.info("Bạn đã nhận voucher này rồi!");
        setClaiming((prev) => ({ ...prev, [voucher.id]: false }));
        return;
      }

      // Cập nhật voucher: tăng claimed_count
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`,
        {
          claimed_count: (voucher.claimed_count || 0) + 1,
        },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Thêm mã vào users.voucher_codes
      await axios.patch(
        `${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`,
        {
          voucher_codes: [...currentCodes, voucher.code],
        },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(`Bạn đã nhận thành công voucher ${voucher.code}!`);
      setVouchers((prev) => prev.filter((v) => v.id !== voucher.id));
    } catch (err) {
      console.error("Lỗi nhận voucher:", err);
      toast.error("Voucher đã hết lượt hoặc có lỗi xảy ra!");
    } finally {
      setClaiming((prev) => ({ ...prev, [voucher.id]: false }));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return "Không giới hạn";
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <Header />
      <div className="voucher-page-container">
        <div className="voucher-page-wrapper">
          <h1 className="voucher-page-title">Mã Giảm Giá & Ưu Đãi</h1>
          <p className="voucher-page-subtitle">
            {user
              ? "Nhận voucher miễn phí để sử dụng khi thanh toán!"
              : "Đăng nhập để nhận voucher miễn phí!"}
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
                const remaining = voucher.total_issued
                  ? voucher.total_issued - (voucher.claimed_count || 0)
                  : null;
                const isClaiming = claiming[voucher.id];

                return (
                  <div key={voucher.id} className="voucher-card">
                    <div className="voucher-header">
                      <h3>{voucher.code}</h3>
                      <span className="voucher-discount">
                        Giảm {formatPrice(voucher.discount_amount)}
                      </span>
                    </div>

                    <div className="voucher-body">
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
                        disabled={isClaiming}
                      >
                        {isClaiming ? "Đang nhận..." : "Nhận voucher"}
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
