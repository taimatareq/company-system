import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";

function AdministrationPage({ setPage }) {
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users/me/")
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data);
      })
      .catch((error) => {
        if (error.message !== "SESSION_EXPIRED") {
          console.error(error);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


const isSystemAdmin = currentUser?.is_superuser === true;

const cards = [
  ...(isSystemAdmin || currentUser?.role === "company_admin"
    ? [
        {
          title: t("users"),
          page: "users",
        },
      ]
    : []),

  ...(!isSystemAdmin
    ? [
        { title: t("branches"), page: "branches" },
        { title: t("warehouses"), page: "warehouses" },
        { title: t("customers"), page: "customers" },
        { title: t("suppliers"), page: "suppliers" },
        { title: t("pos"), page: "pos" },
        { title: t("cash_boxes"), page: "cash-boxes" },
        {
          title: t("expense_categories"),
          page: "expense-categories",
        },
        {
          title: t("exchange_rates"),
          page: "exchange-rates",
        },
        {
          title: t("sales_representatives"),
          page: "sales-representatives",
        },
      ]
    : []),
];

  if (loading) {
    return (
      <div className="loading-state">
        {t("loading")}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("administration")}
          </h1>

          <p className="page-subtitle">
            {t("manage_system_setup")}
          </p>
        </div>
      </div>

      <div className="administration-grid">
        {cards.map((card) => (
          <div
            key={card.page}
            className="administration-card"
            onClick={() => setPage(card.page)}
            style={{ cursor: "pointer" }}
          >
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </>
  );
}

export default AdministrationPage;