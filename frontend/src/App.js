import { useState } from "react";

import LoginPage from "./pages/LoginPage.jsx";
import ItemsPage from "./pages/ItemsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";

import { Toaster } from "react-hot-toast";
import "./styles/app.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("access_token")
  );

  const [page, setPage] = useState("items");

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

    {/* <div className="top-bar">
      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div> */}

    {page === "items" && (
      <ItemsPage setPage={setPage} />
    )}

    {page === "inventory" && (
      <InventoryPage setPage={setPage} />
    )}
  </>
);
}

export default App;