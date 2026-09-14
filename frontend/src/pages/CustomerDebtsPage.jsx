import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function CustomerDebtsPage() {
    const { t } = useTranslation();

  const [invoices, setInvoices] = useState([]);

 useEffect(() => {

  apiFetch("/sales-invoices/")
    .then((res) => res.json())
    .then((data) => {

      const list =
        Array.isArray(data)
        ? data
        : data.results || [];

      console.log(
      list.map(
      (i)=>({
      id:i.id,
      status:i.status,
      remaining:i.remaining,
      paid:i.total_paid
      })
      )
      );

      const debts = list.filter(
        (invoice) =>
          Number(invoice.remaining || 0) > 0
      );

      setInvoices(

      debts.sort(
        (a,b)=>

        b.id-a.id

      )

);

      
    });

}, []);
return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("customer_debts")}
        </h1>

        <p className="page-subtitle">
          {t("track_unpaid_customer_invoices")}
        </p>
      </div>
    </div>

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("customer")}</th>
            <th>{t("invoice")}</th>
            <th>{t("total")}</th>
            <th>{t("paid")}</th>
            <th>{t("remaining")}</th>
            <th>{t("action")}</th>
          </tr>
        </thead>

        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6B7280",
                  fontWeight: "500",
                }}
              >
                {t("no_customer_debts")}
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.customer_name}</td>

                <td>
                  SI-
                  {String(invoice.id).padStart(4, "0")}
                </td>

                <td>${invoice.total_amount_usd}</td>

                <td>${invoice.total_paid}</td>

                <td>${invoice.remaining}</td>

                <td style={{ textAlign: "center" }}>
                  <button
                    style={{
                      background: "#9CA3AF",
                      color: "white",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                    onClick={() => {
                      localStorage.setItem(
                        "selectedPaymentInvoice",
                        invoice.id
                      );

                      localStorage.setItem(
                        "page",
                        "sales-payments"
                      );

                      window.location.reload();
                    }}
                  >
                    {t("pay")}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </>
);
  
}

export default CustomerDebtsPage;