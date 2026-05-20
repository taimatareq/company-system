import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function DashboardPage() {
  const [salesCount, setSalesCount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    Promise.all([
      apiFetch("/sales-invoices/"),
      apiFetch("/purchase-invoices/"),
      apiFetch("/items/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((r) => r.json()))
      )
      .then(([sales, purchases, items]) => {
        setSalesCount(
          Array.isArray(sales)
            ? sales.length
            : sales.results?.length || 0
        );

        setPurchaseCount(
          Array.isArray(purchases)
            ? purchases.length
            : purchases.results?.length || 0
        );

        setItemsCount(
          Array.isArray(items)
            ? items.length
            : items.results?.length || 0
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Sales Invoices</h3>
          <strong>{salesCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Purchase Invoices</h3>
          <strong>{purchaseCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Items</h3>
          <strong>{itemsCount}</strong>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;