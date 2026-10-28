import SalesInvoicesPage from "./pages/SalesInvoicesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import ExpensesPage from "./pages/ExpensesPage";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import ExpenseCategoriesPage from "./pages/ExpenseCategoriesPage";
import Layout from "./components/layout/Layout.jsx";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage.jsx";
import { apiFetch } from "./api";
import { Toaster } from "react-hot-toast";
import "./styles/app.css";
import PurchaseInvoiceDetailPage from "./pages/PurchaseInvoiceDetailPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import SalesInvoiceDetailPage from "./pages/SalesInvoiceDetailPage.jsx";
import DashboardPage from "./pages/DashboardPage";
import { useEffect, useState } from "react";
import SalesPaymentsPage from "./pages/SalesPaymentsPage";
import PurchasePaymentsPage from "./pages/PurchasePaymentsPage";
import CashBoxesPage from "./pages/CashBoxesPage";
import CustomerDebtsPage from "./pages/CustomerDebtsPage";
import AdministrationPage from "./pages/AdministrationPage";
import DamagesPage from "./pages/DamagesPage";
import SupplierDebtsPage from "./pages/SupplierDebtsPage";
import BranchesPage from"./pages/BranchesPage";
import SalesReturnsPage from "./pages/SalesReturnsPage.jsx";
import WarehousesPage from "./pages/WarehousesPage";
import SystemAdministrationPage from "./pages/SystemAdministrationPage";
import POSPage from "./pages/POSPage";
import ExchangeRatesPage
from "./pages/ExchangeRatesPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import SalesRepresentativesPage from "./pages/SalesRepresentativesPage";
import ReportsPage from "./pages/ReportsPage";
import SalesReportPage from "./pages/SalesReportPage";
import PurchaseReportPage from "./pages/PurchaseReportPage";
import InventoryReportPage from "./pages/InventoryReportPage";
import CustomerStatementPage from "./pages/CustomerStatementPage";
import SupplierStatementPage from "./pages/SupplierStatementPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import ProfilePage from "./pages/ProfilePage";
import AveragePriceReportPage from "./pages/AveragePriceReportPage";
function App() {
  console.log(
  "TOKEN BEFORE APP:",
  localStorage.getItem("access_token")
);

const [isLoggedIn, setIsLoggedIn] = useState(
  !!localStorage.getItem("access_token")
);

const [currentUser, setCurrentUser] = useState(null);

const [page, setPage] = useState(
  localStorage.getItem("page") || "dashboard"
);

const systemAdminPages = [
  "system-administration",
  "administration",
  "users",
  "profile",
];

const isSystemAdmin = currentUser?.is_superuser === true;

const activePage =
  isSystemAdmin && !systemAdminPages.includes(page)
    ? "system-administration"
    : page;

const navigateTo = (newPage) => {
  window.history.pushState(
    { page: newPage },
    "",
    `?page=${newPage}`
  );

  setPage(newPage);
};
  useEffect(() => {
  const handlePopState = (event) => {
    const previousPage =
      event.state?.page ||
      new URLSearchParams(window.location.search).get("page") ||
      "dashboard";

    localStorage.setItem("page", previousPage);
    setPage(previousPage);
  };

  window.addEventListener("popstate", handlePopState);

  return () => {
    window.removeEventListener("popstate", handlePopState);
  };
}, []);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] =
   useState(localStorage.getItem("selectedPurchaseInvoice"));

  const [selectedSalesInvoice, setSelectedSalesInvoice] =
  useState(localStorage.getItem("selectedSalesInvoice"));

 const handleLogout = () => {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  localStorage.removeItem(
    "page"
  );

  setPage("dashboard");
  setIsLoggedIn(false);
  setCurrentUser(null);
};
  useEffect(() => {
    localStorage.setItem("page", page);
  }, [page]);
  useEffect(() => {
  if (!isLoggedIn) return;
  const navigateTo = (newPage) => {
  window.history.pushState(
    { page: newPage },
    "",
    `?page=${newPage}`
  );

  setPage(newPage);
};
  const loadCurrentUser = async () => {
    try {
      const response = await apiFetch("/users/me/");

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Failed to load current user:",
          response.status,
          errorText
        );

        return;
      }

      const data = await response.json();

      console.log("CURRENT USER:", data);

      setCurrentUser(data);
    } catch (error) {
      console.error("Current user error:", error);
    }
  };

  loadCurrentUser();
}, [isLoggedIn]);


if (!isLoggedIn) {
  return (
    <>
      <Toaster position="top-right" />
      <LoginPage onLogin={() => setIsLoggedIn(true)} />
    </>
  );
}

if (!currentUser) {
  return (
    <>
      <Toaster position="top-right" />
      <div className="loading-state">
        Loading user permissions...
      </div>
    </>
  );
}


  return (
    <>
      <Toaster position="top-right" />

      <Layout
  page={activePage}
  setPage={navigateTo}
  onLogout={handleLogout}
  currentUser={currentUser}
>


{activePage === "items" && <ItemsPage />}
{activePage === "expenses" && <ExpensesPage />}
{activePage === "inventory" && <InventoryPage />}

{activePage === "purchase-invoices" && (
  <PurchaseInvoicesPage
    setPage={setPage}
    setSelectedPurchaseInvoice={setSelectedPurchaseInvoice}
  />
)}

{activePage === "purchases" && (
  <PurchasesPage setPage={setPage} />
)}

{activePage === "purchase-invoice-detail" && (
  <PurchaseInvoiceDetailPage
    invoiceId={selectedPurchaseInvoice}
    setPage={setPage}
  />
)}

{activePage === "dashboard" && <DashboardPage />}

{activePage === "sales-invoice-detail" && (
  <SalesInvoiceDetailPage
    invoiceId={selectedSalesInvoice}
    setPage={setPage}
  />
)}

{activePage === "sales-invoices" && (
  <SalesInvoicesPage
    setPage={setPage}
    setSelectedSalesInvoice={setSelectedSalesInvoice}
  />
)}

{activePage === "sales" && (
  <SalesPage setPage={setPage} />
)}

{activePage === "sales-payments" && <SalesPaymentsPage />}
{activePage === "sales-returns" && <SalesReturnsPage />}
{activePage === "expense-categories" && <ExpenseCategoriesPage />}
{activePage === "purchase-payments" && <PurchasePaymentsPage />}
{activePage === "customer-debts" && <CustomerDebtsPage />}
{activePage === "supplier-debts" && <SupplierDebtsPage />}

{activePage === "system-administration" && (
  <SystemAdministrationPage setPage={setPage} />
)}

{activePage === "administration" && (
  <AdministrationPage setPage={navigateTo} />
)}

{activePage === "users" && (
  <UsersPage setPage={setPage} />
)}

{activePage === "branches" && <BranchesPage />}
{activePage === "warehouses" && <WarehousesPage />}
{activePage === "pos" && <POSPage />}
{activePage === "exchange-rates" && <ExchangeRatesPage />}
{activePage === "damages" && <DamagesPage />}
{activePage === "customers" && <CustomersPage />}
{activePage === "suppliers" && <SuppliersPage />}

{activePage === "sales-representatives" && (
  <SalesRepresentativesPage />
)}

{activePage === "reports" && (
  <ReportsPage setPage={setPage} />
)}

{activePage === "sales-report" && <SalesReportPage />}

{activePage === "cash-boxes" && (
  <CashBoxesPage
    setPage={setPage}
    setSelectedSalesInvoice={setSelectedSalesInvoice}
  />
)}

{activePage === "purchases-report" && <PurchaseReportPage />}
{activePage === "inventory-report" && <InventoryReportPage />}
{activePage === "customer-statement" && <CustomerStatementPage />}
{activePage === "supplier-statement" && <SupplierStatementPage />}
{activePage === "notifications" && <NotificationsPage />}
{activePage === "profile" && <ProfilePage />}

{activePage === "average-price-report" && (
  <AveragePriceReportPage setPage={setPage} />
)}


      </Layout>
    </>
  );
}

export default App;