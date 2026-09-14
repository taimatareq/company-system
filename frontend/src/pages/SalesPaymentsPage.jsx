import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function SalesPaymentsPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [invoice,setInvoice]=useState(localStorage.getItem("selectedPaymentInvoice")||"");  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [invoiceTotal,setInvoiceTotal]=useState(0);
  const [paidAmount,setPaidAmount]=useState(0);
  const [remaining,setRemaining]=useState(0);
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

  // const handleSavePayment = async () => {
  //   if (!invoice || !amount || Number(amount) <= 0) {
  //     alert("Please select invoice and enter valid amount");
  //     return;
  //   }
  //   if (Number(amount) > Number(remaining)) {
  //     alert(`Payment cannot be greater than remaining amount: $${remaining}`);
  //     return;
  //   }
  //   const response = await apiFetch("/sales-payments/", {
  //     method: "POST",
  //     body: JSON.stringify({
  //       invoice: Number(invoice),
  //       payment_date: new Date(paymentDate).toISOString(),
  //       amount: Number(amount),
  //       notes,
  //     }),
  //   });

  //   if (!response.ok) {
  //     const error = await response.json();
  //     alert(JSON.stringify(error));
  //     return;
  //   }
  //   const paymentData = await response.json();

  //   alert("Payment saved successfully");

  //   window.open(
  //     `http://127.0.0.1:8000/api/sales-payments/${paymentData.id}/receipt/`,
  //     "_blank"
  //   );

  //   localStorage.removeItem("selectedPaymentInvoice");
  //   localStorage.removeItem("paymentLocked");

  //   localStorage.setItem("page", "customer-debts");

  //   window.location.reload();
  //   const updatedResponse = await apiFetch("/sales-invoices/");
  //   const updatedData = await updatedResponse.json();

  //   const updatedList = Array.isArray(updatedData)
  //   ? updatedData
  //   : updatedData.results || [];

  //   setInvoices(
  //   updatedList.filter(
  //       (invoice) =>
  //       invoice.status === "unpaid" ||
  //       invoice.status === "partial"
  //   )
  //   );
  //   setInvoice("");
  //   setAmount("");
  //   setNotes("");
  // };
const handleSavePayment = async () => {
  if (!invoice || !amount || Number(amount) <= 0) {
    alert("Please select invoice and enter valid amount");
    return;
  }

  if (Number(amount) > Number(remaining)) {
    alert(`Payment cannot be greater than remaining amount: $${remaining}`);
    return;
  }

  const response = await apiFetch("/sales-payments/", {
    method: "POST",
    body: JSON.stringify({
      invoice: Number(invoice),
      payment_date: new Date(paymentDate).toISOString(),
      amount: Number(amount),
      notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    alert(JSON.stringify(error));
    return;
  }

  const paymentData = await response.json();

  alert("Payment saved successfully");

  window.open(
    `http://127.0.0.1:8000/api/sales-payments/${paymentData.id}/receipt/`,
    "_blank"
  );

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
  </>
);
}

export default SalesPaymentsPage;