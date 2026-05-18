import { useEffect, useState } from "react";
const API_URL = "http://127.0.0.1:8000/api";
function PurchaseInvoicesPage({setPage,setSelectedPurchaseInvoice,}) {
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [selectedStatus, setSelectedStatus] = useState("all");
const [selectedPaymentType, setSelectedPaymentType] =
  useState("all");
useEffect(() => {
  const token = localStorage.getItem("access_token");

  fetch(`${API_URL}/purchase-invoices/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("PURCHASE INVOICES:", data);

      setInvoices(
        Array.isArray(data)
          ? data
          : data.results || []
      );

      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);
const filteredInvoices = invoices.filter((invoice) => {

  const matchesSearch =
    invoice.invoice_number
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||

    invoice.supplier
      ?.toLowerCase()
      .includes(search.toLowerCase()) ||

    invoice.warehouse
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =
    selectedStatus === "all" ||
    invoice.status === selectedStatus;

  const matchesPaymentType =
    selectedPaymentType === "all" ||
    invoice.payment_type === selectedPaymentType;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPaymentType
  );
});
const [currentPage, setCurrentPage] = useState(1);

const itemsPerPage = 5;

const totalPages = Math.ceil(
  filteredInvoices.length / itemsPerPage
);

const startIndex =
  (currentPage - 1) * itemsPerPage;

const endIndex =
  startIndex + itemsPerPage;

const currentInvoices =
  filteredInvoices.slice(
    startIndex,
    endIndex
  );
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Purchase Invoices
          </h1>

          <p className="page-subtitle">
            Manage purchase invoices
          </p>
        </div>

        <button
          className="add-btn"
          onClick={() => setPage("purchases")}
        >
          Create Invoice
        </button>
      </div>
      <div className="table-header">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
        </div>
        <div>
          <div className="filter-buttons">
  {["all", "paid", "unpaid", "partial"].map((status) => (
    <button
      key={status}
      className={selectedStatus === status ? "filter-btn active" : "filter-btn"}
      onClick={() => setSelectedStatus(status)}
    >
      {status === "all" ? "All Status" : status}
    </button>
    
  ))}
  
</div>
<div className="filter-buttons">
  {["all", "cash", "credit"].map((type) => (
    <button
      key={type}
      className={
        selectedPaymentType === type
          ? "filter-btn active"
          : "filter-btn"
      }
      onClick={() =>
        setSelectedPaymentType(type)
      }
    >
      {type === "all"
        ? "All Payments"
        : type}
    </button>
  ))}
</div>
        </div>
      </div>
      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Supplier</th>
              <th>Warehouse</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total USD</th>
              <th>Total SYP</th>
            </tr>
          </thead>

          <tbody>

{currentInvoices.map((invoice) => (
      <tr key={invoice.id}>

      <td>
  <span
  className="invoice-link"
  onClick={() => {
    setSelectedPurchaseInvoice(invoice.id);
    setPage("purchase-invoice-detail");
  }}
>
  {invoice.invoice_number}
</span>
</td>

      <td>
        {invoice.supplier}
      </td>

      <td>
        {invoice.warehouse}
      </td>

      <td>
        {new Date(
          invoice.invoice_date
        ).toLocaleDateString()}
      </td>

      <td>
        {invoice.status}
      </td>
      <td>
        {invoice.payment_type}
      </td>
      <td>
        ${invoice.total_amount_usd}
      </td>

      <td>
        {invoice.total_amount_syp}
      </td>

    </tr>

  ))}

</tbody>
        </table>
        <div className="pagination">

  <button
    onClick={() =>
      setCurrentPage(currentPage - 1)
    }
    disabled={currentPage === 1}
  >
    Previous
  </button>

  <span>
    Page {currentPage} of{" "}
    {totalPages || 1}
  </span>

  <button
    onClick={() =>
      setCurrentPage(currentPage + 1)
    }
    disabled={
      currentPage === totalPages ||
      totalPages === 0
    }
  >
    Next
  </button>

</div>
      </div>
    </>
  );
}

export default PurchaseInvoicesPage;