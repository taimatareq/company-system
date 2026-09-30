import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import AlertModal from "../components/common/AlertModal";
import PaymentSuccessModal from "../components/common/PaymentSuccessModal";
function SalesPaymentsPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [invoice,setInvoice]=useState(localStorage.getItem("selectedPaymentInvoice")||"");  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [invoiceTotal,setInvoiceTotal]=useState(0);
  const [paidAmount,setPaidAmount]=useState(0);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [successModal, setSuccessModal] = useState({
  isOpen: false,
  receiptUrl: "",
    });
  const [cashBox, setCashBox] = useState(""); 
  const [cashBoxesLoading, setCashBoxesLoading] = useState(false);
  const [remaining,setRemaining]=useState(0);
  const [alertModal, setAlertModal] = useState({
  isOpen: false,
  message: "",
});
  useEffect(()=>{

    if(!invoice){

    setInvoiceTotal(0);

    setPaidAmount(0);

    setRemaining(0);

    return;

    }

    const selectedInvoice=
    invoices.find(
    (i)=>
    i.id===Number(invoice)
    );

    if(!selectedInvoice)
    return;

    const total=
    Number(
    selectedInvoice
    .total_amount_usd
    ||0
    );

    const paid=
    Number(
    selectedInvoice
    .total_paid
    ||0
    );

    setInvoiceTotal(
    total
    );

    setPaidAmount(
    paid
    );

    setRemaining(
    total-paid
    );

    },[
    invoice,
    invoices
    ]);
  useEffect(() => {
    apiFetch("/sales-invoices/")
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];

        setInvoices(
          list.filter(
            (invoice) =>
              Number(invoice.remaining || 0) > 0
          )
        );
      });
  }, []);
 useEffect(() => {
  if (!invoice) {
    setCashBoxes([]);
    setCashBox("");
    setCashBoxesLoading(false);
    return;
  }

  const selectedInvoice = invoices.find(
    (inv) => inv.id === Number(invoice)
  );

  if (!selectedInvoice?.branch) {
    setCashBoxes([]);
    setCashBox("");
    setCashBoxesLoading(false);
    return;
  }

  setCashBoxesLoading(true);

  apiFetch(`/cashboxes/?branch=${selectedInvoice.branch}`)
    .then((res) => res.json())
    .then((data) => {
      const boxes = Array.isArray(data)
        ? data
        : data?.results || [];

      const cashOnly = boxes.filter(
        (box) => box.box_type === "cash"
      );

      setCashBoxes(cashOnly);

      if (cashOnly.length === 1) {
        setCashBox(String(cashOnly[0].id));
      } else {
        setCashBox("");
      }
    })
    .catch((error) => {
      console.error("Error loading cash boxes:", error);
      setCashBoxes([]);
      setCashBox("");
    })
    .finally(() => {
      setCashBoxesLoading(false);
    });
}, [invoice, invoices]);
const handleSavePayment = async () => {
  if (!invoice || !amount || Number(amount) <= 0) {
    setAlertModal({
      isOpen: true,
      message: t("select_invoice_valid_amount"),
    });
    return;
  }
 if (!cashBox) {
  setAlertModal({
    isOpen: true,
    message:
      cashBoxes.length === 0
        ? t("no_cash_box_create_first")
        : t("please_select_cash_box"),
  });

  return;
}
  if (Number(amount) > Number(remaining)) {
    setAlertModal({
      isOpen: true,
      message: `${t("payment_exceeds_remaining")} $${Number(remaining).toFixed(2)}`,
    });   
     return;
  }
  console.log("PAYMENT DATA:", {
    invoice: Number(invoice),
    cashBox: cashBox,
    cash_box: Number(cashBox),
    amount: Number(amount),
  });
  const response = await apiFetch("/sales-payments/", {
    method: "POST",
    body: JSON.stringify({
      invoice: Number(invoice),
      cash_box: Number(cashBox),
      payment_date: new Date(paymentDate).toISOString(),
      amount: Number(amount),
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    setAlertModal({
      isOpen: true,
      message:
        error?.detail ||
        error?.message ||
        t("payment_save_failed"),
    });    
    return;
  }

  const paymentData = await response.json();

  setSuccessModal({
  isOpen: true,
  receiptUrl: `http://127.0.0.1:8000/api/sales-payments/${paymentData.id}/receipt/`,
});
};
const handleViewReceipt = () => {
  window.open(successModal.receiptUrl, "_blank");
};

const handleCloseSuccess = () => {
  localStorage.removeItem("selectedPaymentInvoice");
  localStorage.removeItem("paymentLocked");

  localStorage.setItem("page", "customer-debts");

  window.location.reload();
};
return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("sales_payments")}
        </h1>

        <p className="page-subtitle">
          {t("record_customer_payments")}
        </p>
      </div>
    </div>

    <div className="card">
      <div className="form-grid">

        <div className="form-group">
          <label>
            {t("invoice")}
          </label>

          <select
            value={invoice}
            disabled={
              !!localStorage.getItem("selectedPaymentInvoice")
            }
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
                SI-
                {String(inv.id).padStart(4, "0")}
                {" - "}
                {inv.customer_name || inv.customer}
                {" - $"}
                {inv.total_amount_usd}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            {t("invoice_total")}
          </label>

          <input
            type="text"
            value={`$${Number(invoiceTotal || 0).toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>
            {t("paid")}
          </label>

          <input
            type="text"
            value={`$${Number(paidAmount || 0).toFixed(2)}`}
            readOnly
          />
        </div>

        <div className="form-group">
          <label>
            {t("remaining")}
          </label>

          <input
            type="text"
            value={`$${Number(remaining || 0).toFixed(2)}`}
            readOnly
          />
        </div>
            <div className="form-group">
  <label>
    {t("cash_box")}
  </label>

  <select
  value={cashBox}
  onChange={(e) => setCashBox(e.target.value)}
  disabled={cashBoxesLoading || cashBoxes.length === 0}
>
  <option value="">
    {cashBoxesLoading
      ? t("loading")
      : cashBoxes.length === 0
      ? t("no_cash_box_for_branch")
      : t("select_cash_box")}
  </option>

  {cashBoxes.map((box) => (
    <option
      key={box.id}
      value={box.id}
    >
      {box.name}
    </option>
  ))}
</select>



</div>
        <div className="form-group">
          <label>
            {t("new_payment_amount")}
          </label>

          <input
            type="number"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>
            {t("payment_date")}
          </label>

          <input
            type="datetime-local"
            value={paymentDate}
            onChange={(e) =>
              setPaymentDate(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>
            {t("notes")}
          </label>

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
    </div>
    <AlertModal
  isOpen={alertModal.isOpen}
  title={t("alert")}
  message={alertModal.message}
  onClose={() =>
    setAlertModal({
      isOpen: false,
      message: "",
    })
  }
/>
<PaymentSuccessModal
  isOpen={successModal.isOpen}
  title={t("payment_success")}
  message={t("payment_saved_successfully")}
  viewReceiptText={t("view_receipt")}
  closeText={t("close")}
  onViewReceipt={handleViewReceipt}
  onClose={handleCloseSuccess}
/>
  </>
);
}

export default SalesPaymentsPage;