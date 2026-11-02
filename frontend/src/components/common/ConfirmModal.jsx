import { useTranslation } from "react-i18next";

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content alert-modal"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="alert-modal-icon">!</div>

        <h3>{title || t("confirmation")}</h3>

        <p className="alert-modal-message">
          {message}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn"
            onClick={onCancel}
            disabled={loading}
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            className={`modal-btn ${danger ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;