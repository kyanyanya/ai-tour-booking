/* eslint-disable react-hooks/set-state-in-effect */
// src/components/modals/RatingModal.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/components/modals/RatingModal.css";

const RatingModal = ({
  isOpen,
  onClose,
  tourId,
  existingReview,
  onSuccess,
}) => {
  const { user, session } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao từ 1 đến 5!");
      return;
    }

    try {
      if (existingReview) {
        // Sửa đánh giá
        await axios.patch(
          `${SUPABASE_URL}/rest/v1/reviews?id=eq.${existingReview.id}`,
          { rating, comment },
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );
        toast.success("Đã cập nhật đánh giá thành công!");
      } else {
        // Tạo mới
        await axios.post(
          `${SUPABASE_URL}/rest/v1/reviews`,
          {
            tour_id: tourId,
            user_id: user.id,
            rating,
            comment,
          },
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
          }
        );
        toast.success("Đánh giá đã được gửi thành công!");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi xử lý đánh giá:", err);
      toast.error("Không thể lưu đánh giá. Vui lòng thử lại!");
    }
  };

  return (
    <div className="rm-modal-overlay" onClick={onClose}>
      <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{existingReview ? "Sửa đánh giá" : "Đánh giá tour"}</h2>
        <div className="rm-rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`rm-star ${star <= rating ? "active" : ""}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>
        <textarea
          className="rm-comment"
          placeholder="Nhập bình luận của bạn..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="rm-actions">
          <button className="rm-btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button className="rm-btn-submit" onClick={handleSubmit}>
            {existingReview ? "Cập nhật" : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
