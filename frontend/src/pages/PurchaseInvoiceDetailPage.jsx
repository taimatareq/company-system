import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

const API_URL = "http://127.0.0.1:8000/api";

function PurchaseInvoiceDetailPage({ invoiceId, setPage }) {
    const { t } = useTranslation();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    apiFetch(`/purchase-invoices/${invoiceId}/`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [invoiceId]);

  if (loading) {
    return <div className="loading-state">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="empty-state">Invoice not found</div>;
  }

  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">{invoice.invoice_number}</h1>
        <p className="page-subtitle">
          {t("purchase_invoice_details")}
        </p>
      </div>

      <div className="page-actions">
        <button
          className="secondary-btn"
          onClick={() => setPage("purchase-invoices")}
        >
          {t("back")}
        </button>
      </div>
    </div>

    <div className="card">
      <div className="invoice-info-grid">
        <p><strong>{t("supplier")}:</strong> {invoice.supplier}</p>
        <p><strong>{t("branch")}:</strong> {invoice.branch}</p>
        <p><strong>{t("warehouse")}:</strong> {invoice.warehouse}</p>
        <p><strong>{t("date")}:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
        <p><strong>{t("payment")}:</strong> {invoice.payment_type}</p>
        <p><strong>{t("status")}:</strong> {invoice.status}</p>
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
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td>{item.item}</td>
              <td>{item.quantity}</td>
              <td>{item.unit_cost_usd}</td>
              <td>{item.unit_cost_syp}</td>
              <td>{item.total_usd}</td>
              <td>{item.total_syp}</td>
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

    <div>
      <div className="invoice-actions">
        <button
          className="print-invoice-btn"
          onClick={() => {
            document.title = invoice.invoice_number;
            window.print();
          }}
        >
          {t("print_invoice")}
        </button>
      </div>
    </div>
  </>
);
}

export default PurchaseInvoiceDetailPage;