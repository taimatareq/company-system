import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function PurchaseReportPage() {
  const [invoices, setInvoices] = useState([]);
  const { t } = useTranslation();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const loadData = () => {
    Promise.all([
      apiFetch("/purchase-invoices/"),
      apiFetch("/warehouses/"),
      apiFetch("/suppliers/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([purchaseData, warehousesData, suppliersData]) => {
        const purchaseList =
  Array.isArray(purchaseData)
    ? purchaseData
    : purchaseData.results || [];

setInvoices(purchaseList);


        setWarehouses(
    Array.isArray(warehousesData)
        ? warehousesData
        : warehousesData.results || []
    );

        setSuppliers(
          Array.isArray(suppliersData)
            ? suppliersData
            : suppliersData.results || []
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatus = (invoice) => {
    const paid = Number(invoice.total_paid || 0);
    const remaining = Number(invoice.remaining || 0);

    if (remaining <= 0) return "paid";
    if (paid > 0) return "partial";
    return "unpaid";
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoice_date);

    if (fromDate) {
      const from = new Date(fromDate);
      if (invoiceDate < from) return false;
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (invoiceDate > to) return false;
    }

    const selectedWarehouseName =
  warehouses.find(
    (w) => String(w.id) === String(warehouse)
  )?.name;

if (
  warehouse &&
  invoice.warehouse !== selectedWarehouseName
) {
  return false;
}

        const selectedSupplierName =
        suppliers.find(
            (s) => String(s.id) === String(supplier)
        )?.name;

        if (
        supplier &&
        invoice.supplier !== selectedSupplierName
        ) {
        return false;
        }

    if (
        supplier &&
        invoice.supplier !==
        suppliers.find(
            s=>String(s.id)===String(supplier)
        )?.name
        ){
        return false;
        }

    if (status && getStatus(invoice) !== status) {
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
    setWarehouse("");
    setSupplier("");
    setStatus("");
  };

 return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("purchase_report")}
        </h1>

        <p className="page-subtitle">
          {t("purchase_analytics")}
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
          )
            .toISOString()
            .slice(0, 10);

          const last = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
          )
            .toISOString()
            .slice(0, 10);

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
        value={warehouse}
        onChange={(e) => setWarehouse(e.target.value)}
      >
        <option value="">
          {t("all_warehouses")}
        </option>

        {warehouses.map((warehouse) => (
          <option
            key={warehouse.id}
            value={warehouse.id}
          >
            {warehouse.name}
          </option>
        ))}
      </select>

      <select
        value={supplier}
        onChange={(e) => setSupplier(e.target.value)}
      >
        <option value="">
          {t("all_suppliers")}
        </option>

        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
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
        <h3>{t("total_purchases_usd")}</h3>
        <strong>${totalUSD.toLocaleString()}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("total_purchases_syp")}</h3>
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
            <th>{t("supplier")}</th>
            <th>{t("total_usd")}</th>
            <th>{t("total_syp")}</th>
            <th>{t("paid_usd")}</th>
            <th>{t("remaining_usd")}</th>
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
                    `PI${String(invoice.id).padStart(5, "0")}`}
                </td>

                <td>{invoice.invoice_date?.slice(0, 10)}</td>

                <td>{invoice.supplier_name || invoice.supplier || "-"}</td>

                <td>
                  ${Number(invoice.total_amount_usd || 0).toLocaleString()}
                </td>

                <td>
                  SYP{" "}
                  {Number(
                    invoice.total_amount_syp || 0
                  ).toLocaleString()}
                </td>

                <td>
                  $
                  {Math.min(
                    Number(invoice.total_paid || 0),
                    Number(invoice.total_amount_usd || 0)
                  ).toLocaleString()}
                </td>

                <td>
                  $
                  {Math.max(
                    Number(invoice.remaining || 0),
                    0
                  ).toLocaleString()}
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

export default PurchaseReportPage;