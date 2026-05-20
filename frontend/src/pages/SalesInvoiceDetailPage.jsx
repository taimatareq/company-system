import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const API_URL = "http://127.0.0.1:8000/api";

function SalesInvoiceDetailPage({ invoiceId, setPage }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="loading-state">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="empty-state">Invoice not found</div>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            SI-{String(invoice.id).padStart(4, "0")}
          </h1>
          <p className="page-subtitle">Sales invoice details</p>
        </div>

        <button
          className="secondary-btn"
          onClick={() => setPage("sales-invoices")}
        >
          Back
        </button>
      </div>

      <div className="card">
        <div className="invoice-info-grid">
          <p><strong>Customer:</strong> {invoice.customer_name}</p>
          <p><strong>Branch:</strong> {invoice.branch_name}</p>
          <p><strong>Warehouse:</strong> {invoice.warehouse_name}</p>
          <p><strong>Sales Rep:</strong> {invoice.sales_rep_name|| "-"}</p>
          <p><strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
          <p><strong>Payment:</strong> {invoice.payment_type}</p>
          <p><strong>Status:</strong> {invoice.status}</p>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit USD</th>
              <th>Unit SYP</th>
              <th>Total USD</th>
              <th>Total SYP</th>
            </tr>
          </thead>

          <tbody>
            {(invoice.items || []).map((item) => (
              <tr key={item.id}>
                <td>{item.item_name }</td>
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
            <span>Total USD</span>
            <strong>${invoice.total_amount_usd}</strong>
          </div>

          <div>
            <span>Total SYP</span>
            <strong>{invoice.total_amount_syp} SYP</strong>
          </div>
        </div>
      </div>

      <div className="invoice-actions">
        <button
          className="print-invoice-btn"
          onClick={() => {
            document.title = `SI-${String(invoice.id).padStart(4, "0")}`;
            window.print();
          }}
        >
          Print Invoice
        </button>
      </div>
    </>
  );
}

export default SalesInvoiceDetailPage;