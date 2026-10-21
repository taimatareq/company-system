import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function NotificationsPage() {
  const [data, setData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    apiFetch("/notifications/")
      .then((res) => res.json())
      .then((result) => {
        setData(result);
      });
  }, []);

  if (!data) {
    return <h2>Loading...</h2>;
  }

  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("notifications")}
        </h1>

        <p className="page-subtitle">
          {t("system_alerts")}
        </p>
      </div>
    </div>

    <div
  className="dashboard-card debt-summary-card"
  onClick={() => {
    localStorage.setItem("page", "customer-debts");
    window.location.reload();
  }}
>
  <h3>{t("customer_debts")}</h3>

  <div className="debt-summary-stats">
    <div className="debt-stat">
      <strong>{data.customer_debts}</strong>
      <span>{t("outstanding_invoices")}</span>
    </div>

    <div className="debt-stat alert-stat">
      <strong>{data.customer_alerts}</strong>
      <span>{t("current_alerts")}</span>
    </div>
  </div>
</div>
{data.customer_debt_items?.length > 0 && (
<div className="card table-wrapper notifications-table-card">
      <h2>{t("customer_payment_alerts")}</h2>

    <table>
      <thead>
        <tr>
          <th>{t("invoice")}</th>
          <th>{t("customer")}</th>
          <th>{t("status")}</th>
          <th>{t("due_date")}</th>
          <th>{t("due_status")}</th>
          <th>{t("paid")}</th>
          <th>{t("remaining")}</th>
          <th>{t("actions")}</th>
        </tr>
      </thead>

      <tbody>
        {data.customer_debt_items.map((item) => (
          <tr key={item.invoice_id}>
            <td>
              {item.invoice_number}
            </td>

            <td>
              {item.customer}
            </td>

            <td>
              {item.status === "partial"
                ? t("partial")
                : t("unpaid")}
            </td>

            <td>
              {item.due_date || "-"}
            </td>
                <td>
  <span className={`due-badge ${item.due_status}`}>
    {item.due_status === "overdue"
      ? `${t("overdue")} (${item.days_difference} ${t("days")})`
      : item.due_status === "due_today"
      ? t("due_today")
      : item.due_status === "due_soon"
      ? `${t("due_soon")} (${item.days_difference} ${t("days")})`
      : item.due_status === "upcoming"
      ? t("upcoming")
      : t("no_due_date")}
  </span>
</td>
            <td>
              ${Number(item.paid || 0).toFixed(2)}
            </td>

            <td>
              <strong>
                ${Number(item.remaining || 0).toFixed(2)}
              </strong>
            </td>
            <td>
  <button
    className="pay-btn"
    onClick={(e) => {
      e.stopPropagation();

      localStorage.setItem(
        "selectedPaymentInvoice",
        String(item.invoice_id)
      );

      localStorage.setItem("page", "sales-payments");

      window.location.reload();
    }}
  >
    {t("pay")}
  </button>
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    <br />

    <div
      className="dashboard-card"
      style={{ cursor: "pointer" }}
      onClick={() => {
        localStorage.setItem("page", "supplier-debts");
        window.location.reload();
      }}
    >
      <h3>{t("supplier_debts")}</h3>
      <strong>{data.supplier_debts}</strong>
    </div>

    <br />

    <div
      className="dashboard-card"
      style={{ cursor: "pointer" }}
      onClick={() => {
        localStorage.setItem("page", "inventory-report");
        window.location.reload();
      }}
    >
      <h3>{t("out_of_stock")}</h3>
      <strong>{data.out_of_stock}</strong>
    </div>
  </>
);
}

export default NotificationsPage;