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
      className="dashboard-card"
      style={{ cursor: "pointer" }}
      onClick={() => {
        localStorage.setItem("page", "customer-debts");
        window.location.reload();
      }}
    >
      <h3>{t("customer_debts")}</h3>
      <strong>{data.customer_debts}</strong>
    </div>

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