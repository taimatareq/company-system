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
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );
  const [page, setPage] = useState("items");
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] =
    useState(null);
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
  };

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
        {page === "purchase-invoice-detail" && (<PurchaseInvoiceDetailPage invoiceId={selectedPurchaseInvoice} setPage={setPage}
        
  />
  
)}
        {page === "sales-invoices" && (
          <SalesInvoicesPage setPage={setPage} />
        )}

       {page === "sales" && (
  <SalesPage setPage={setPage} />
)}
      </Layout>
    </>
  );
}

export default App;