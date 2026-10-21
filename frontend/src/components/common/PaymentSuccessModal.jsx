function PaymentSuccessModal({
  isOpen,
  onViewReceipt,
  onClose,
  title,
  message,
  viewReceiptText,
  closeText,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content payment-success-modal">

        <div className="success-modal-icon">✓</div>

        <h3>{title}</h3>

        <p className="alert-modal-message">
          {message}
        </p>

        <div className="modal-actions">
          <button
            className="modal-btn primary"
            onClick={onViewReceipt}
          >
            {viewReceiptText}
          </button>

          <button
            className="secondary-btn"
            onClick={onClose}
          >
            {closeText}
          </button>
        </div>

      </div>
    </div>
  );
}

export default PaymentSuccessModal;