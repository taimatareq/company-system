import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
const API_URL = "http://127.0.0.1:8000/api";

function SalesInvoiceDetailPage({ invoiceId, setPage }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  useEffect(() => {

    apiFetch(
  `/sales-invoices/${invoiceId}/`
)
      .then((res) => res.json())
      .then((data) => {
        console.log("SALES INVOICE DETAIL:", data);
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [invoiceId]);

  if (loading) {
  return <div className="loading-state">{t("loading_invoice")}</div>;
}

if (!invoice) {
  return <div className="empty-state">{t("invoice_not_found")}</div>;
}
  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          SI-{String(invoice.id).padStart(4, "0")}
        </h1>

        <p className="page-subtitle">
          {t("sales_invoice_details")}
        </p>
      </div>

      <button
        className="edit-btn"
        onClick={() => setPage("sales-invoices")}
      >
        {t("back")}
      </button>
    </div>

    <div className="card">
      <div className="invoice-info-grid">
        <p>
          <strong>{t("customer")}:</strong>{" "}
          {invoice.customer_name}
        </p>

        <p>
          <strong>{t("branch")}:</strong>{" "}
          {invoice.branch_name}
        </p>

        <p>
          <strong>{t("warehouse")}:</strong>{" "}
          {invoice.warehouse_name}
        </p>

        <p>
          <strong>{t("sales_rep")}:</strong>{" "}
          {invoice.sales_rep_name || "-"}
        </p>

        <p>
          <strong>{t("date")}:</strong>{" "}
          {new Date(invoice.invoice_date).toLocaleDateString()}
        </p>

        <p>
          <strong>{t("payment")}:</strong>{" "}
          {t(invoice.payment_type)}
        </p>

        <p>
          <strong>{t("status")}:</strong>{" "}
          {t(invoice.status)}
        </p>
      </div>
    </div>

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("item")}</th>
            <th>{t("quantity")}</th>
            <th>{t("unit_usd")}</th>
            <th>{t("unit_syp")}</th>
            <th>{t("total_usd")}</th>
            <th>{t("total_syp")}</th>
          </tr>
        </thead>

        <tbody>
          {(invoice.items || []).map((item) => (
            <tr key={item.id}>
              <td>{item.item_name}</td>
              <td>{item.quantity}</td>
              <td>{item.unit_price_usd}</td>
              <td>{item.unit_price_syp}</td>

              <td>
                {(
                  Number(item.quantity || 0) *
                  Number(item.unit_price_usd || 0)
                ).toFixed(2)}
              </td>

              <td>
                {(
                  Number(item.quantity || 0) *
                  Number(item.unit_price_syp || 0)
                ).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div>
          <span>{t("total_usd")}</span>
          <strong>${invoice.total_amount_usd}</strong>
        </div>

        <div>
          <span>{t("total_syp")}</span>
          <strong>{invoice.total_amount_syp} SYP</strong>
        </div>
      </div>
    </div>

    <div className="invoice-actions">
      <button
        className="add-btn"
        onClick={() => {
          document.title = `SI-${String(invoice.id).padStart(4, "0")}`;
          window.print();
        }}
      >
        {t("print_invoice")}
      </button>
    </div>
  </>
);
}

export default SalesInvoiceDetailPage;