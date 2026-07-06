import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function CustomerStatementPage() {
    const { t } = useTranslation();

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [customer, setCustomer] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const loadData = () => {
    Promise.all([
      apiFetch("/customers/"),
      apiFetch("/sales-invoices/"),
      apiFetch("/sales-payments/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([customersData, invoicesData, paymentsData]) => {
        setCustomers(Array.isArray(customersData) ? customersData : customersData.results || []);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : invoicesData.results || []);
        setPayments(Array.isArray(paymentsData) ? paymentsData : paymentsData.results || []);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(customer)
  );

const customerInvoices = invoices.filter((invoice) => {
  if (String(invoice.customer) !== String(customer)) {
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

const customerPayments = payments.filter((payment) => {
  if (String(payment.customer) !== String(customer)) {
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


    const customerInvoiceOptions = customer
    ? invoices.filter(
        (invoice) => String(invoice.customer) === String(customer)
        )
    : [];
  // const customerPayments = payments.filter(
  //   (payment) => String(payment.customer) === String(customer)
  // );
  

    const transactions = [
    ...customerInvoices.map((invoice) => ({
        invoiceId: invoice.id,
        date: invoice.invoice_date,
        movement: "Sales Invoice",
        reference:
        invoice.invoice_number ||
        `SI${String(invoice.id).padStart(5, "0")}`,
        debit: Number(invoice.total_amount_usd || 0),
        credit: 0,
    })),

    ...customerPayments.map((payment) => ({
        invoiceId: payment.invoice,
        date: payment.payment_date,
        movement: "Payment",
        reference:payment.invoice_number ||`Payment #${payment.id}`,
        debit: 0,
        credit: Number(payment.amount || 0),
    })),
    ]
    .filter((row) => {
        const rowDate = new Date(row.date);

        if (fromDate && rowDate < new Date(fromDate)) return false;

        if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (rowDate > to) return false;
        }

        return true;
    })
    .sort((a, b) => {
  if (a.invoiceId !== b.invoiceId) {
    return Number(a.invoiceId || 0) - Number(b.invoiceId || 0);
  }

  if (a.movement === "Sales Invoice" && b.movement === "Payment") {
    return -1;
  }

  if (a.movement === "Payment" && b.movement === "Sales Invoice") {
    return 1;
  }

  return new Date(a.date) - new Date(b.date);
});
    let runningBalance = 0;

const statementRows = transactions.map((row) => {
  runningBalance += row.debit - row.credit;

  return {
    ...row,
    balance: runningBalance,
  };
});

const totalInvoices = statementRows.reduce(
  (sum, row) => sum + Number(row.debit || 0),
  0
);

const totalPayments = statementRows.reduce(
  (sum, row) => sum + Number(row.credit || 0),
  0
);

const currentBalance = totalInvoices - totalPayments;

const clearFilters = () => {
  setCustomer("");
  setInvoiceFilter("");
  setFromDate("");
  setToDate("");
};
  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">{t("customer_statement")}</h1>
        <p className="page-subtitle">
          {t("customer_invoices_payments_balance")}
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
        value={customer}
        onChange={(e) => {
          setCustomer(e.target.value);
          setInvoiceFilter("");
        }}
      >
        <option value="">{t("select_customer_required")}</option>

        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      <select
        value={invoiceFilter}
        onChange={(e) => setInvoiceFilter(e.target.value)}
        disabled={!customer}
      >
        <option value="">{t("all_invoices")}</option>

        {customerInvoiceOptions.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>
            {invoice.invoice_number ||
              `SI${String(invoice.id).padStart(5, "0")}`}
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

      <button
        className="clear-filters-btn"
        onClick={clearFilters}
      >
        {t("clear_filters")}
      </button>
    </div>

    {!customer ? (
      <div
        className="card"
        style={{ padding: "32px", textAlign: "center" }}
      >
        {t("please_select_customer_statement")}
      </div>
    ) : (
      <>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>{t("customer")}</h3>
            <strong>{selectedCustomer?.name || "-"}</strong>
          </div>

          <div className="dashboard-card">
            <h3>{t("total_sales")}</h3>
            <strong>${totalInvoices.toLocaleString()}</strong>
          </div>

          <div className="dashboard-card">
            <h3>{t("total_payments")}</h3>
            <strong>${totalPayments.toLocaleString()}</strong>
          </div>

          <div className="dashboard-card">
            <h3>{t("current_balance")}</h3>
            <strong>${currentBalance.toLocaleString()}</strong>
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
                      color: "#6B7280",
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
      </>
    )}
  </>
);
}

export default CustomerStatementPage;