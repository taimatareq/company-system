import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api"; 

function Layout({ page, setPage, onLogout, children }) {
  const [notificationCount, setNotificationCount] = useState(0);

  const { t, i18n } = useTranslation();
  useState(0);
useEffect(() => {
  apiFetch("/notifications/")
    .then((res) => res.json())
    .then((data) => {
      setNotificationCount(
        data.total || 0
      );
    })
    .catch((error) => {
      console.log(error);
    });
}, []);
    return (
    
    <div className="app">
      
      <aside className="sidebar">
        
        <h2 className="logo">ERP System</h2>
<div className="language-switcher">
  <span>EN</span>

  <label className="lang-switch">
    <input
      type="checkbox"
      checked={i18n.language === "ar"}
      onChange={() => {
        const lang =
          i18n.language === "ar"
            ? "en"
            : "ar";

        i18n.changeLanguage(lang);
        localStorage.setItem("lang", lang);

        document.body.dir =
          lang === "ar" ? "rtl" : "ltr";
      }}
    />

    <span className="lang-slider"></span>
  </label>

  <span>AR</span>
</div>
        <div className="menu">
          <div
  className={
    page === "notifications"
      ? "menu-item active"
      : "menu-item"
  }
  onClick={() => setPage("notifications")}
>
  <span className="notification-menu-label">
  {t("notifications")}

    {notificationCount > 0 && (
      <span className="notification-badge">
        {notificationCount}
      </span>
    )}
  </span>
</div>
  <div
    className={page === "dashboard" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("dashboard")}
  >
<span>{t("dashboard")}</span>  </div>
  <div
className={
page==="administration"
?
"menu-item active"
:
"menu-item"
}

onClick={()=>
setPage(
"administration"
)
}
>

<span>{t("administration")}</span>


</div>
  <div
    className={page === "items" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("items")}
  >
<span>{t("items")}</span>  </div>

  <div
    className={page === "inventory" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("inventory")}
  >
    <span>{t("inventory")}</span>

  </div>

  <div
    className={
      page === "purchase-invoices"
        ? "menu-item active"
        : "menu-item"
    }
    onClick={() => {
      localStorage.removeItem("selectedPurchasePaymentInvoice");
      setPage("purchase-invoices");
    }}  >
    <span>{t("purchases")}</span>

  </div>

  <div
    className={
      page === "sales-invoices"
        ? "menu-item active"
        : "menu-item"
    }
    onClick={() => setPage("sales-invoices")}
  >
    <span>{t("sales")}</span>

  </div>
  
<div
className={
page==="sales-payments"
?"menu-item active"
:"menu-item"
}

onClick={() => {

localStorage.removeItem(
"selectedPaymentInvoice"
);

setPage(
"sales-payments"
);

}}

>

<span>{t("sales_payments")}</span>


</div>
<div
  className={
    page === "purchase-payments"
      ? "menu-item active"
      : "menu-item"
  }

  onClick={() => {

    localStorage.removeItem(
      "selectedPurchasePaymentInvoice"
    );

    localStorage.removeItem(
      "purchasePaymentLocked"
    );

    setPage(
      "purchase-payments"
    );

  }}

>

  <span>{t("purchase_payments")}</span>


</div>
<div
  className={
    page === "customer-debts"
      ? "menu-item active"
      : "menu-item"
  }
  onClick={() =>
    setPage("customer-debts")
  }
>
  <span>{t("customer_debts")}</span>

</div>
<div
className={
page==="supplier-debts"
?"menu-item active"
:"menu-item"
}

onClick={()=>

setPage(
"supplier-debts"
)

}

>

<span>{t("supplier_debts")}</span>


</div>
<div
  className={
    page === "reports"
      ? "menu-item active"
      : "menu-item"
  }
  onClick={() => setPage("reports")}
>
  <span>{t("reports")}</span>
</div>
</div>

      <button className="logout-btn" onClick={onLogout}>
  {t("logout")}
</button>
      </aside>

      <main className="main">{children}</main>
      
    </div>
    
  );
  
}

export default Layout;