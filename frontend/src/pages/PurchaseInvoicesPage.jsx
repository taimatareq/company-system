import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
const API_URL = "http://127.0.0.1:8000/api";
function PurchaseInvoicesPage({setPage,setSelectedPurchaseInvoice,}) {
const { t } = useTranslation();
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [selectedStatus, setSelectedStatus] = useState("all");
const [selectedPaymentType, setSelectedPaymentType] =
  useState("all");
useEffect(() => {

    apiFetch("/purchase-invoices/")
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
          {t("purchase_invoices")}
        </h1>

        <p className="page-subtitle">
          {t("manage_purchase_invoices")}
        </p>
      </div>

      <button
        className="add-btn"
        onClick={() => setPage("purchases")}
      >
        {t("create_invoice")}
      </button>
    </div>

    <div className="table-header">
      <div className="search-box">
        <input
          type="text"
          placeholder={t("search_invoices")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
        <div className="filter-buttons">
          {["all", "paid", "unpaid", "partial"].map((status) => (
            <button
              key={status}
              className={
                selectedStatus === status
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() => setSelectedStatus(status)}
            >
              {status === "all" ? t("all_status") : t(status)}
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
              onClick={() => setSelectedPaymentType(type)}
            >
              {type === "all" ? t("all_payments") : t(type)}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("invoice")}</th>
            <th>{t("supplier")}</th>
            <th>{t("warehouse")}</th>
            <th>{t("date")}</th>
            <th>{t("status")}</th>
            <th>{t("payment")}</th>
            <th>{t("total_usd")}</th>
            <th>{t("total_syp")}</th>
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
                    localStorage.setItem(
                      "selectedPurchaseInvoice",
                      invoice.id
                    );
                    setPage("purchase-invoice-detail");
                  }}
                >
                  {invoice.invoice_number}
                </span>
              </td>

              <td>{invoice.supplier}</td>
              <td>{invoice.warehouse}</td>

              <td>
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </td>

              <td>{t(invoice.status)}</td>
              <td>{t(invoice.payment_type)}</td>
              <td>${invoice.total_amount_usd}</td>
              <td>{invoice.total_amount_syp}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {t("previous")}
        </button>

        <span>
          {t("page")} {currentPage} {t("of")} {totalPages || 1}
        </span>

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          {t("next")}
        </button>
      </div>
    </div>
  </>
);
}

export default PurchaseInvoicesPage;