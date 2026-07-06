import { useEffect,useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function SupplierDebtsPage(){
  const { t } = useTranslation();

const [invoices,setInvoices]=
useState([]);

useEffect(()=>{

apiFetch(
"/purchase-invoices/"
)

.then(
(res)=>res.json()
)

.then((data)=>{

const list=
Array.isArray(data)
?data
:data.results||[];

const debts=
list.filter(

(invoice)=>

Number(
invoice.remaining||0
)>0

);

setInvoices(

  debts.sort(
    (a,b)=>

    b.id-a.id

  )

);

});

},[]);

return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {t("supplier_debts")}
        </h1>

        <p className="page-subtitle">
          {t("track_supplier_balances")}
        </p>
      </div>
    </div>

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("supplier")}</th>
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
                }}
              >
                {t("no_supplier_debts")}    
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.supplier}</td>

                <td>
                  PI-
                  {String(invoice.id).padStart(4, "0")}
                </td>

                <td>
                  ${invoice.total_amount_usd}
                </td>

                <td>
                  ${invoice.total_paid}
                </td>

                <td>
                  ${invoice.remaining}
                </td>

                <td style={{ textAlign: "center" }}>
                  <button
                    style={{
                      background: "#9CA3AF",
                      color: "white",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      console.log("PAY PURCHASE INVOICE ID:", invoice.id);

                      localStorage.setItem(
                        "selectedPurchasePaymentInvoice",
                        String(invoice.id)
                      );

                      localStorage.setItem(
                        "purchasePaymentLocked",
                        "true"
                      );

                      localStorage.setItem(
                        "page",
                        "purchase-payments"
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

export default SupplierDebtsPage;