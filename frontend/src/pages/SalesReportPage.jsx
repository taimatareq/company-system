import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function SalesReportPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]); 
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branch, setBranch] = useState("");
  const [customer, setCustomer] = useState("");
  const [status, setStatus] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);

  const loadData = () => {
    Promise.all([
      apiFetch("/sales-invoices/"),
      apiFetch("/branches/"),
      apiFetch("/customers/"),
      apiFetch("/sales-representatives/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([salesData, branchesData, customersData, salesRepsData]) => {
        
const invoicesList =
  Array.isArray(salesData)
    ? salesData
    : salesData.results || [];

setInvoices(invoicesList);

        setBranches(
          Array.isArray(branchesData)
            ? branchesData
            : branchesData.results || []
        );

        setCustomers(
          Array.isArray(customersData)
            ? customersData
            : customersData.results || []
        );

        setSalesReps(
          Array.isArray(salesRepsData)
            ? salesRepsData
            : salesRepsData.results || []
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoice_date);

    if (fromDate) {
      const from = new Date(fromDate);

      if (invoiceDate < from) {
        return false;
      }
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      if (invoiceDate > to) {
        return false;
      }
    }

    if (branch && String(invoice.branch) !== String(branch)) {
      return false;
    }

    if (customer && String(invoice.customer) !== String(customer)) {
      return false;
    }

    if (salesRep && String(invoice.sales_rep) !== String(salesRep)) {
      return false;
    }

    const paid = Number(invoice.total_paid || 0);
    const remaining = Number(invoice.remaining || 0);

    const realStatus =
      remaining <= 0
        ? "paid"
        : paid > 0
        ? "partial"
        : "unpaid";

    if (status && realStatus !== status) {
      return false;
    }

    return true;
  });

  const totalUSD = filteredInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total_amount_usd || 0),
    0
  );

  const totalSYP = filteredInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total_amount_syp || 0),
    0
  );

 const totalPaidUSD = filteredInvoices.reduce(
  (sum, invoice) =>
    sum +
    Math.min(
      Number(invoice.total_paid || 0),
      Number(invoice.total_amount_usd || 0)
    ),
  0
);

const totalRemainingUSD = filteredInvoices.reduce(
  (sum, invoice) =>
    sum + Math.max(Number(invoice.remaining || 0), 0),
  0
);

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setBranch("");
    setCustomer("");
    setSalesRep("");
    setStatus("");
  };
const getStatus = (invoice) => {
  const paid = Number(invoice.total_paid || 0);
  const remaining = Number(invoice.remaining || 0);

  if (remaining <= 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
};
 return (
  <>
    <div className="page-header">

      <div>
        <h1 className="page-title">
          {t("sales_report")}
        </h1>

        <p className="page-subtitle">
          {t("sales_analytics")}
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

      <button
        className="filter-btn"
        onClick={() => {
          const today = new Date().toISOString().slice(0, 10);
          setFromDate(today);
          setToDate(today);
        }}
      >
        {t("today")}
      </button>

      <button
        className="filter-btn"
        onClick={() => {
          const now = new Date();

          const first = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          ).toISOString().slice(0, 10);

          const last = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
          ).toISOString().slice(0, 10);

          setFromDate(first);
          setToDate(last);
        }}
      >
        {t("this_month")}
      </button>

      <button
        className="filter-btn"
        onClick={() => {
          const now = new Date();

          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 6);

          setFromDate(lastWeek.toISOString().slice(0, 10));
          setToDate(now.toISOString().slice(0, 10));
        }}
      >
        {t("last_7_days")}
      </button>

      <select
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
      >
        <option value="">
          {t("all_branches")}
        </option>

        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      <select
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
      >
        <option value="">
          {t("all_customers")}
        </option>

        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      <select
        value={salesRep}
        onChange={(e) => setSalesRep(e.target.value)}
      >
        <option value="">
          {t("all_sales_reps")}
        </option>

        {salesReps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">
          {t("all_status")}
        </option>

        <option value="paid">
          {t("paid")}
        </option>

        <option value="partial">
          {t("partial")}
        </option>

        <option value="unpaid">
          {t("unpaid")}
        </option>
      </select>

      <button
        className="clear-filters-btn"
        onClick={clearFilters}
      >
        {t("clear_filters")}
      </button>

    </div>

    <div className="dashboard-grid">

      <div className="dashboard-card">
        <h3>{t("total_sales_usd")}</h3>
        <strong>${totalUSD.toLocaleString()}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("total_sales_syp")}</h3>
        <strong>SYP {totalSYP.toLocaleString()}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("paid_usd")}</h3>
        <strong>${totalPaidUSD.toLocaleString()}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("remaining_usd")}</h3>
        <strong>${totalRemainingUSD.toLocaleString()}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("invoices")}</h3>
        <strong>{filteredInvoices.length}</strong>
      </div>

    </div>

    <br />

    <div className="card table-wrapper">

      <table>

        <thead>
          <tr>
            <th>{t("invoice")}</th>
            <th>{t("date")}</th>
            <th>{t("customer")}</th>
            <th>{t("total_usd")}</th>
            <th>{t("total_syp")}</th>
            <th>{t("paid_usd")}</th>
            <th>{t("remaining_syp")}</th>
            <th>{t("status")}</th>
          </tr>
        </thead>

        <tbody>

          {filteredInvoices.length === 0 ? (

            <tr>
              <td
                colSpan="8"
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "#6B7280",
                }}
              >
                {t("no_invoices_found")}
              </td>
            </tr>

          ) : (

            filteredInvoices.map((invoice) => (

              <tr key={invoice.id}>

                <td>
                  {invoice.invoice_number ||
                    `SI${String(invoice.id).padStart(5, "0")}`}
                </td>

                <td>{invoice.invoice_date?.slice(0, 10)}</td>

                <td>{invoice.customer_name || "-"}</td>

                <td>
                  ${Number(invoice.total_amount_usd || 0).toLocaleString()}
                </td>

                <td>
                  SYP {Number(invoice.total_amount_syp || 0).toLocaleString()}
                </td>

                <td>
                  ${Number(invoice.total_paid || 0).toLocaleString()}
                </td>

                <td>
                  ${Math.max(Number(invoice.remaining || 0), 0).toLocaleString()}
                </td>

                <td>{getStatus(invoice)}</td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </>
);
}

export default SalesReportPage;