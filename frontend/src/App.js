import { useState } from "react";
import SalesInvoicesPage from "./pages/SalesInvoicesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import Layout from "./components/layout/Layout.jsx";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage.jsx";
import { apiFetch } from "./api";
import { Toaster } from "react-hot-toast";
import "./styles/app.css";
import PurchaseInvoiceDetailPage from "./pages/PurchaseInvoiceDetailPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import SalesInvoiceDetailPage from "./pages/SalesInvoiceDetailPage.jsx";
import DashboardPage from "./pages/DashboardPage";
import { useEffect } from "react";
import SalesPaymentsPage from "./pages/SalesPaymentsPage";
import PurchasePaymentsPage from "./pages/PurchasePaymentsPage";
import CustomerDebtsPage from "./pages/CustomerDebtsPage";
import AdministrationPage from "./pages/AdministrationPage";
import SupplierDebtsPage from "./pages/SupplierDebtsPage";
import BranchesPage from"./pages/BranchesPage";
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
  localStorage.getItem("page")
  || "dashboard"
);
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

  const loadCurrentUser = async () => {
    try {
      const response = await apiFetch("/users/me/");

      if (!response.ok) {
        console.error("Failed to load current user");
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

  return (
    <>
      <Toaster position="top-right" />

      <Layout
        page={page}
        setPage={setPage}
        onLogout={handleLogout}
        currentUser={currentUser}
      >
        {page === "items" && <ItemsPage />}
        {page === "inventory" && <InventoryPage />}
        {page === "purchase-invoices" && (<PurchaseInvoicesPage setPage={setPage}setSelectedPurchaseInvoice={setSelectedPurchaseInvoice}/>)}     
        {page === "purchases" && (<PurchasesPage setPage={setPage} />)}
        {page === "purchase-invoice-detail" && (<PurchaseInvoiceDetailPage invoiceId={selectedPurchaseInvoice} setPage={setPage}/>)}
        {page === "dashboard" && <DashboardPage />}
        {page === "sales-invoice-detail" && (<SalesInvoiceDetailPage invoiceId={selectedSalesInvoice}setPage={setPage}/>)}
        {page === "sales-invoices" && (<SalesInvoicesPage setPage={setPage} setSelectedSalesInvoice={setSelectedSalesInvoice}/>)}
        {page === "sales" && (<SalesPage setPage={setPage} />)}
        {page === "sales-payments" && (<SalesPaymentsPage />)}
        {page === "purchase-payments" && (<PurchasePaymentsPage />)}
        {page === "customer-debts" && (<CustomerDebtsPage />)}
        {page === "supplier-debts" && (<SupplierDebtsPage />)}
        {page === "system-administration" && (<SystemAdministrationPage setPage={setPage} />)}
        {page === "administration" && <AdministrationPage />}
        {page === "users" && <UsersPage setPage={setPage} />}
        {page==="branches"&&<BranchesPage/>}
        {page === "warehouses" && <WarehousesPage />}
        {page === "pos" && <POSPage />}
        {page==="exchange-rates"&&<ExchangeRatesPage/>}
        {page==="customers"&&<CustomersPage/>}
        {page === "suppliers" && <SuppliersPage />}
        {page === "sales-representatives" && <SalesRepresentativesPage />}
        {page === "reports" && <ReportsPage />}
        {page ==="sales-report"&&<SalesReportPage/>}
        {page === "purchases-report" && <PurchaseReportPage />}
        {page === "inventory-report" && <InventoryReportPage />}
        {page === "customer-statement" && <CustomerStatementPage />}
        {page === "supplier-statement" && <SupplierStatementPage />}
        {page === "notifications" &&<NotificationsPage />}
        {page === "profile" && <ProfilePage />}
        

      </Layout>
    </>
  );
}

export default App;