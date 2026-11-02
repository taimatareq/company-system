import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import AlertModal from "../components/common/AlertModal";

function PurchasePaymentsPage() {
  const { t } = useTranslation();

  const selectedFromDebt =
    localStorage.getItem("selectedPurchasePaymentInvoice");

  const isLocked =
    localStorage.getItem("purchasePaymentLocked") === "true";

  const [invoices, setInvoices] = useState([]);

  const [invoice, setInvoice] = useState(
    isLocked ? selectedFromDebt || "" : ""
  );

  const [amount, setAmount] = useState("");

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [notes, setNotes] = useState("");

  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [successfulPayment, setSuccessfulPayment] = useState(null);

  const showAlert = (message, title = "") => {
    setAlertModal({
      isOpen: true,
      title,
      message,
    });
  };

  useEffect(() => {
    if (!invoice) {
      setInvoiceTotal(0);
      setPaidAmount(0);
      setRemaining(0);
      return;
    }

    const selectedInvoice = invoices.find(
      (i) => i.id === Number(invoice)
    );

    if (!selectedInvoice) {
      return;
    }

    const total = Number(
      selectedInvoice.total_amount_usd || 0
    );

    const paid = Number(
      selectedInvoice.total_paid || 0
    );

    const remainingAmount =
      Math.round((total - paid) * 100) / 100;

    setInvoiceTotal(total);
    setPaidAmount(paid);
    setRemaining(
      remainingAmount > 0 ? remainingAmount : 0
    );
  }, [invoice, invoices]);

  useEffect(() => {
    apiFetch("/purchase-invoices/")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data.results || [];

        const payableInvoices = list.filter(
          (invoice) =>
            invoice.status !== "paid" &&
            Number(invoice.remaining || 0) > 0
        );

        if (isLocked && selectedFromDebt) {
          const selectedInvoice = payableInvoices.find(
            (invoice) =>
              Number(invoice.id) ===
              Number(selectedFromDebt)
          );

          setInvoices(
            selectedInvoice ? [selectedInvoice] : []
          );

          return;
        }

        setInvoices(payableInvoices);
      })
      .catch((error) => {
        console.error(
          "Error loading purchase invoices:",
          error
        );

        setInvoices([]);
      });
  }, [isLocked, selectedFromDebt]);

  const handleSavePayment = async () => {
    if (
      !invoice ||
      !amount ||
      Number(amount) <= 0
    ) {
      showAlert(
        t("select_invoice_and_valid_amount")
      );
      return;
    }

    const paymentAmount =
      Math.round(Number(amount) * 100) / 100;

    const remainingAmount =
      Math.round(Number(remaining) * 100) / 100;

    if (paymentAmount > remainingAmount) {
      showAlert(
        t("payment_exceeds_remaining", {
          amount: remainingAmount.toFixed(2),
        })
      );

      return;
    }

    try {
      const response = await apiFetch(
        "/purchase-payments/",
        {
          method: "POST",
          body: JSON.stringify({
            invoice: Number(invoice),
            payment_date: new Date(
              paymentDate
            ).toISOString(),
            amount: paymentAmount,
            notes,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        showAlert(
          error.detail ||
            error.message ||
            t("error_saving_payment")
        );

        return;
      }

      const paymentData =
        await response.json();

      setSuccessfulPayment(paymentData);

      showAlert(
        t("payment_saved_successfully"),
        t("success")
      );
    } catch (error) {
      console.error(
        "Error saving purchase payment:",
        error
      );

      showAlert(
        t("error_saving_payment")
      );
    }
  };

  const handleAlertClose = () => {
    setAlertModal({
      isOpen: false,
      title: "",
      message: "",
    });

    if (!successfulPayment) {
      return;
    }

    window.open(
      `http://127.0.0.1:8000/api/purchase-payments/${successfulPayment.id}/receipt/`,
      "_blank"
    );

    localStorage.removeItem(
      "selectedPurchasePaymentInvoice"
    );

    localStorage.removeItem(
      "purchasePaymentLocked"
    );

    localStorage.setItem(
      "page",
      "supplier-debts"
    );

    window.location.reload();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("purchase_payments")}
          </h1>

          <p className="page-subtitle">
            {t("record_supplier_payments")}
          </p>
        </div>
      </div>

      <div className="card">
  {invoices.length === 0 ? (
    <div className="empty-state">
      <div className="empty-state-icon">✓</div>

      <h3>{t("no_supplier_debts")}</h3>

      <p>
        {t("no_supplier_debts_description")}
      </p>
    </div>
  ) : (
    <>
      <div className="form-grid">

        <div className="form-group">
          <label>{t("invoice")}</label>

          <select
            value={invoice}
            disabled={isLocked}
            onChange={(e) =>
              setInvoice(e.target.value)
            }
          >
            <option value="">
              {t("select_invoice")}
            </option>

            {invoices.map((inv) => (
              <option
                key={inv.id}
                value={inv.id}
              >
                PI-
                {String(inv.id).padStart(4, "0")}
                {" - "}
                {inv.supplier_name || inv.supplier}
                {" - $"}
                {inv.total_amount_usd}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t("invoice_total")}</label>

          <input
            value={`$${Number(
              invoiceTotal || 0
            ).toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>{t("paid")}</label>

          <input
            value={`$${Number(
              paidAmount || 0
            ).toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>{t("remaining")}</label>

          <input
            value={`$${Number(
              remaining || 0
            ).toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>
            {t("new_payment_amount")}
          </label>

          <div className="payment-amount-row">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
            />

            <button
              type="button"
              className="pay-full-btn"
              disabled={Number(remaining) <= 0}
              onClick={() =>
                setAmount(
                  Number(
                    remaining || 0
                  ).toFixed(2)
                )
              }
            >
              {t("pay_full_remaining")}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>{t("payment_date")}</label>

          <input
            type="datetime-local"
            value={paymentDate}
            onChange={(e) =>
              setPaymentDate(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>{t("notes")}</label>

          <input
            type="text"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />
        </div>

      </div>

      <button
        className="add-btn"
        onClick={handleSavePayment}
      >
        {t("save_payment")}
      </button>
    </>
  )}
</div>

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        onClose={handleAlertClose}
      />
    </>
  );
}

export default PurchasePaymentsPage;