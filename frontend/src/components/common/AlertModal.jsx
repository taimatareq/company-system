function AlertModal({
  isOpen,
  message,
  onClose,
  title = "تنبيه",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content alert-modal">
        <div className="alert-modal-icon">!</div>

        <h3>{title}</h3>

        <p className="alert-modal-message">
          {message}
        </p>

        <div className="modal-actions">
          <button
            className="modal-btn primary"
            onClick={onClose}
          >
            حسناً
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;