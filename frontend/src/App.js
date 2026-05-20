import { useState } from "react";
import SalesInvoicesPage from "./pages/SalesInvoicesPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import Layout from "./components/layout/Layout.jsx";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage.jsx";
import { Toaster } from "react-hot-toast";
import "./styles/app.css";
import PurchaseInvoiceDetailPage from "./pages/PurchaseInvoiceDetailPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import SalesInvoiceDetailPage from "./pages/SalesInvoiceDetailPage.jsx";
import DashboardPage from "./pages/DashboardPage";
import { useEffect } from "react";
function App() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );
  
  const [page, setPage] = useState(
  localStorage.getItem("page")
  || "dashboard"
);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] =
   useState(localStorage.getItem("selectedPurchaseInvoice"));
  
  const [selectedSalesInvoice, setSelectedSalesInvoice] =
  useState(localStorage.getItem("selectedSalesInvoice"));
  
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
  };
  useEffect(() => {
    localStorage.setItem("page", page);
  }, [page]);
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
      >
        {page === "items" && <ItemsPage />}
        {page === "inventory" && <InventoryPage />}
        {page === "purchase-invoices" && (
          <PurchaseInvoicesPage
            setPage={setPage}
            setSelectedPurchaseInvoice={setSelectedPurchaseInvoice}
          />
        )}     
        {page === "purchases" && (<PurchasesPage setPage={setPage} />)}
        {page === "purchase-invoice-detail" && (<PurchaseInvoiceDetailPage invoiceId={selectedPurchaseInvoice} setPage={setPage}/>)}
        {page === "dashboard" && <DashboardPage />}
        {page === "sales-invoice-detail" && (<SalesInvoiceDetailPage invoiceId={selectedSalesInvoice}setPage={setPage}/>)}
        {page === "sales-invoices" && (<SalesInvoicesPage setPage={setPage} setSelectedSalesInvoice={setSelectedSalesInvoice}/>)}
        {page === "sales" && (<SalesPage setPage={setPage} />)}
      </Layout>
    </>
  );
}

export default App;