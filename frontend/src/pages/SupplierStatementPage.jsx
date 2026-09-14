import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function SupplierStatementPage() {
    const { t } = useTranslation();

  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadData = () => {
    Promise.all([
      apiFetch("/suppliers/"),
      apiFetch("/purchase-invoices/"),
      apiFetch("/purchase-payments/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([suppliersData, invoicesData, paymentsData]) => {
        setSuppliers(
          Array.isArray(suppliersData)
            ? suppliersData
            : suppliersData.results || []
        );

        setInvoices(
          Array.isArray(invoicesData)
            ? invoicesData
            : invoicesData.results || []
        );

        setPayments(
          Array.isArray(paymentsData)
            ? paymentsData
            : paymentsData.results || []
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);
// console.log("PURCHASE PAYMENTS:");

// console.log(payments[0]);
const selectedSupplier = suppliers.find(
    (s) => String(s.id) === String(supplier)
  );
const supplierInvoices = invoices.filter((invoice) => {
  if (!selectedSupplier) {
    return false;
  }

  if (invoice.supplier !== selectedSupplier.name) {
    return false;
  }

  if (
    invoiceFilter &&
    String(invoice.id) !== String(invoiceFilter)
  ) {
    return false;
  }

  return true;
});

const supplierPayments = payments.filter((payment) => {
  if (String(payment.supplier) !== String(supplier)) {
    return false;
  }

  if (
    invoiceFilter &&
    String(payment.invoice) !== String(invoiceFilter)
  ) {
    return false;
  }

  return true;
});

const supplierInvoiceOptions = selectedSupplier
  ? invoices.filter(
      (invoice) =>
        invoice.supplier === selectedSupplier.name
    )
  : [];

const transactions = [
  ...supplierInvoices.map((invoice) => ({
    invoiceId: invoice.id,
    date: invoice.invoice_date,
    movement: "Purchase Invoice",
    reference:
      invoice.invoice_number ||
      `PI${String(invoice.id).padStart(5, "0")}`,
    debit: Number(invoice.total_amount_usd || 0),
    credit: 0,
  })),

  ...supplierPayments.map((payment) => ({
    invoiceId: payment.invoice,
    date: payment.payment_date,
    movement: "Supplier Payment",
    reference: payment.invoice_number,
    debit: 0,
    credit: Number(payment.amount || 0),
  })),
]
.filter((row) => {
  const rowDate = new Date(row.date);

  if (fromDate) {
    const from = new Date(fromDate);
    if (rowDate < from) return false;
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23,59,59,999);
    if (rowDate > to) return false;
  }

  return true;
})
.sort((a,b)=>{
  if(a.invoiceId!==b.invoiceId){
    return a.invoiceId-b.invoiceId;
  }

  if(
    a.movement==="Purchase Invoice" &&
    b.movement==="Supplier Payment"
  ){
    return -1;
  }

  if(
    a.movement==="Supplier Payment" &&
    b.movement==="Purchase Invoice"
  ){
    return 1;
  }

  return new Date(a.date)-new Date(b.date);
}); 
let runningBalance = 0;

const statementRows = transactions.map((row) => {
  runningBalance += row.debit - row.credit;

  return {
    ...row,
    balance: runningBalance,
  };
});

const totalPurchases = statementRows.reduce(
  (sum, row) => sum + Number(row.debit || 0),
  0
);

const totalPayments = statementRows.reduce(
  (sum, row) => sum + Number(row.credit || 0),
  0
);

const currentBalance =
  totalPurchases - totalPayments;

const clearFilters = () => {
  setSupplier("");
  setInvoiceFilter("");
  setFromDate("");
  setToDate("");
};
  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("supplier_statement")}
        </h1>

        <p className="page-subtitle">
          {t("supplier_statement_description")}
        </p>
      </div>

      <button
        className="back-btn"
        onClick={() => {
          localStorage.setItem("page", "reports");
          window.location.reload();
        }}
      >
        ← {t("back")}
      </button>
    </div>

    <div className="filters-container">

      <select
        value={supplier}
        onChange={(e) => {
          setSupplier(e.target.value);
          setInvoiceFilter("");
        }}
      >
        <option value="">
          {t("select_supplier")} *
        </option>

        {suppliers.map((supplier) => (
          <option
            key={supplier.id}
            value={supplier.id}
          >
            {supplier.name}
          </option>
        ))}
      </select>

      <select
        value={invoiceFilter}
        onChange={(e) =>
          setInvoiceFilter(e.target.value)
        }
        disabled={!supplier}
      >
        <option value="">
          {t("all_invoices")}
        </option>

        {supplierInvoiceOptions.map((invoice) => (
          <option
            key={invoice.id}
            value={invoice.id}
          >
            {invoice.invoice_number ||
              `PI${String(invoice.id).padStart(5, "0")}`}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
      />

      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
      />

    </div>

    <div className="dashboard-grid">

      <div className="dashboard-card">
        <h3>{t("supplier")}</h3>
        <strong>
          {selectedSupplier?.name || "-"}
        </strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("total_purchases")}</h3>
        <strong>
          ${totalPurchases.toLocaleString()}
        </strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("total_payments")}</h3>
        <strong>
          ${totalPayments.toLocaleString()}
        </strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("current_balance")}</h3>
        <strong>
          ${currentBalance.toLocaleString()}
        </strong>
      </div>

    </div>

    <br />

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("date")}</th>
            <th>{t("movement")}</th>
            <th>{t("reference")}</th>
            <th>{t("debit")}</th>
            <th>{t("credit")}</th>
            <th>{t("balance")}</th>
          </tr>
        </thead>

        <tbody>
          {statementRows.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                style={{
                  textAlign: "center",
                  padding: "32px",
                }}
              >
                {t("no_statement_data")}
              </td>
            </tr>
          ) : (
            statementRows.map((row, index) => (
              <tr key={index}>
                <td>{row.date?.slice(0, 10)}</td>
                <td>{row.movement}</td>
                <td>{row.reference}</td>
                <td>${row.debit.toLocaleString()}</td>
                <td>${row.credit.toLocaleString()}</td>
                <td>${row.balance.toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    <br />
  </>
);
}

export default SupplierStatementPage;