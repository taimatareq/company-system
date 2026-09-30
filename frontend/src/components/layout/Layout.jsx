import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../api"; 

function Layout({ page, setPage, onLogout, currentUser, children }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(
  ["sales-invoices", "sales-payments", "customer-debts"].includes(page)
);

const [purchasesOpen, setPurchasesOpen] = useState(
  ["purchase-invoices", "purchase-payments", "supplier-debts"].includes(page)
);
  const { t, i18n } = useTranslation();
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
        <button
    type="button"
   className={`app-language-btn ${i18n.language === "ar" ? "arabic" : "english"}`}
    onClick={() => {
      const lang =
        i18n.language === "ar" ? "en" : "ar";

      i18n.changeLanguage(lang);
      localStorage.setItem("lang", lang);

      document.body.dir =
        lang === "ar" ? "rtl" : "ltr";
    }}
  >
    {i18n.language === "ar" ? "EN" : "AR"}
  </button>
      
      <aside className="sidebar">
      
 <div className="sidebar-header">



  <h2 className="logo">
    EMESA BUSINESS
  </h2>


</div>

  {currentUser && (
    <div className="user-profile-box" onClick={() => setPage("profile")}>

      {currentUser.profile_image ? (
        <img
    src={`${currentUser.profile_image}?v=${Date.now()}`}
    alt="Profile"
    className="user-profile-image"
  />
      ) : (
        <div className="user-profile-placeholder">
          {currentUser.first_name
            ? currentUser.first_name.charAt(0).toUpperCase()
            : currentUser.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="user-profile-info">

        <div className="user-profile-name">
          {currentUser.first_name || currentUser.username}
          {currentUser.last_name
            ? ` ${currentUser.last_name}`
            : ""}
        </div>
{currentUser.organization && (
  <div className="user-organization">
    {currentUser.organization.name}
  </div>
)}

{currentUser.role && (
  <div className="user-role">
    {currentUser.role === "company_admin"
      ? t("company_admin")
      : t("normal_user")}
  </div>
)}
        {/* <div className="user-profile-email">
          {currentUser.email}
        </div> */}

      </div>

    </div>
  )}


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
<span>{t("dashboard")}</span>  
</div>
{currentUser?.is_superuser && (
  <div
    className={
      page === "system-administration"
        ? "menu-item active"
        : "menu-item"
    }
    onClick={() => setPage("system-administration")}
  >
    <span>{t("system_administration")}</span>
  </div>
)}
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
<div className="sidebar-group">
  <div
    className={`menu-item menu-group-title ${
      ["sales-invoices", "sales-payments", "customer-debts"].includes(page)
        ? "group-active"
        : ""
    }`}
    onClick={() => setSalesOpen(!salesOpen)}
  >
    <span className="menu-group-label">
  {t("sales")}

  <span className={`menu-arrow ${salesOpen ? "open" : ""}`}>
    ▾
  </span>
</span>
  </div>

  {salesOpen && (
    <div className="submenu">

      <div
        className={
          page === "sales-invoices"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => setPage("sales-invoices")}
      >
        {t("invoices")}
      </div>

      <div
        className={
          page === "sales-payments"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => {
          localStorage.removeItem("selectedPaymentInvoice");
          setPage("sales-payments");
        }}
      >
        {t("payments")}
      </div>

      <div
        className={
          page === "customer-debts"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => setPage("customer-debts")}
      >
        {t("customer_debts")}
      </div>

    </div>
  )}
</div>
<div className="sidebar-group">
  <div
    className={`menu-item menu-group-title ${
      [
        "purchase-invoices",
        "purchase-payments",
        "supplier-debts",
      ].includes(page)
        ? "group-active"
        : ""
    }`}
    onClick={() => setPurchasesOpen(!purchasesOpen)}
  >
    <span className="menu-group-label">
  {t("purchases")}

  <span className={`menu-arrow ${purchasesOpen ? "open" : ""}`}>
    ▾
  </span>
</span>
  </div>

  {purchasesOpen && (
    <div className="submenu">

      <div
        className={
          page === "purchase-invoices"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => {
          localStorage.removeItem(
            "selectedPurchasePaymentInvoice"
          );

          setPage("purchase-invoices");
        }}
      >
        {t("invoices")}
      </div>

      <div
        className={
          page === "purchase-payments"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => {
          localStorage.removeItem(
            "selectedPurchasePaymentInvoice"
          );

          localStorage.removeItem(
            "purchasePaymentLocked"
          );

          setPage("purchase-payments");
        }}
      >
        {t("payments")}
      </div>

      <div
        className={
          page === "supplier-debts"
            ? "submenu-item active"
            : "submenu-item"
        }
        onClick={() => setPage("supplier-debts")}
      >
        {t("supplier_debts")}
      </div>

    </div>
  )}
</div>
  {/* <div
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

  </div> */}

  {/* <div
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


</div> */}
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