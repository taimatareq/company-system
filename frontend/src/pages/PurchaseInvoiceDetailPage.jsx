import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const API_URL = "http://127.0.0.1:8000/api";

function PurchaseInvoiceDetailPage({ invoiceId, setPage }) {
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
          <p className="page-subtitle">Purchase invoice details</p>
        </div>

            
            <div className="page-actions">
  <button
    className="secondary-btn"
    onClick={() => setPage("purchase-invoices")}
  >
    Back
  </button>
</div>

      </div>

      <div className="card">
        <div className="invoice-info-grid">
          <p><strong>Supplier:</strong> {invoice.supplier}</p>
          <p><strong>Branch:</strong> {invoice.branch}</p>
          <p><strong>Warehouse:</strong> {invoice.warehouse}</p>
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
            <span>Total USD</span>
            <strong>${invoice.total_amount_usd}</strong>
          </div>

          <div>
            <span>Total SYP</span>
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
            Print Invoice
        </button>
</div>
      </div>
    </>
  );
}

export default PurchaseInvoiceDetailPage;