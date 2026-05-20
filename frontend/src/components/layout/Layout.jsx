function Layout({ page, setPage, onLogout, children }) {
  return (
    
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">ERP System</h2>

        <div className="menu">
  <div
    className={page === "dashboard" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("dashboard")}
  >
    <span>Dashboard</span>
  </div>
  <div
    className={page === "items" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("items")}
  >
    <span>Items</span>
  </div>

  <div
    className={page === "inventory" ? "menu-item active" : "menu-item"}
    onClick={() => setPage("inventory")}
  >
    <span>Inventory</span>
  </div>

  <div
    className={
      page === "purchase-invoices"
        ? "menu-item active"
        : "menu-item"
    }
    onClick={() => setPage("purchase-invoices")}
  >
    <span>Purchases</span>
  </div>

  <div
    className={
      page === "sales-invoices"
        ? "menu-item active"
        : "menu-item"
    }
    onClick={() => setPage("sales-invoices")}
  >
    <span>Sales</span>
  </div>

</div>

        <button className="sidebar-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}

export default Layout;