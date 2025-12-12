// src/components/modals/ConfirmModal.jsx
import React from "react";
import "../../styles/components/modals/ConfirmModal.css";

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="confirm-btn confirm" onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
