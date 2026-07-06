import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function InventoryReportPage() {
  const [rows, setRows] = useState([]);
  const { t } = useTranslation();

  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("item");
  const [warehouse, setWarehouse] = useState("all");
  const [item, setItem] = useState("all");

  const loadFilters = () => {
    Promise.all([
      apiFetch("/warehouses/"),
      apiFetch("/items/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([warehousesData, itemsData]) => {
        setWarehouses(
          Array.isArray(warehousesData)
            ? warehousesData
            : warehousesData.results || []
        );

        setItems(
          Array.isArray(itemsData)
            ? itemsData
            : itemsData.results || []
        );
      });
  };

  const loadReport = () => {
    apiFetch(
      `/inventory/item-stock/?warehouse=${warehouse}&item=${item}`
    )
      .then((res) => res.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
      });
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadReport();
  }, [warehouse, item]);
   const filteredRows = rows.filter((row) => {
    if (
        status !== "all" &&
        row.status !== status
    ) {
        return false;
    }

    return true;
    });
    const totalItems = new Set(
    filteredRows.map(row => row.item_name)
    ).size;

    const totalQuantity = filteredRows.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
    );




  const clearFilters = () => {
    setWarehouse("all");
    setItem("all");
    setStatus("all");
    setSortBy("item");
  };
   

    const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "item") {
        return String(a.item_name || "").localeCompare(
        String(b.item_name || "")
        );
    }

    if (sortBy === "warehouse") {
        return String(a.warehouse_name || "").localeCompare(
        String(b.warehouse_name || "")
        );
    }

    if (sortBy === "quantity_desc") {
        return Number(b.quantity || 0) - Number(a.quantity || 0);
    }

    if (sortBy === "quantity_asc") {
        return Number(a.quantity || 0) - Number(b.quantity || 0);
    }

    if (sortBy === "date_desc") {
        return new Date(b.last_date || 0) - new Date(a.last_date || 0);
    }

    if (sortBy === "date_asc") {
        return new Date(a.last_date || 0) - new Date(b.last_date || 0);
    }

    return 0;
    });
 return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">{t("inventory_report")}</h1>

        <p className="page-subtitle">
          {t("stock_balances_by_warehouse_item")}
        </p>
      </div>

      <button
        className="back-btn"
        onClick={() => {
          localStorage.setItem("page", "reports");
          window.location.reload();
        }}
      >
        ← {t("back")}
      </button>
    </div>

    <div className="filters-container">
      <select
        value={warehouse}
        onChange={(e) => setWarehouse(e.target.value)}
      >
        <option value="all">
          {t("all_warehouses")}
        </option>

        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </select>

      <select
        value={item}
        onChange={(e) => setItem(e.target.value)}
      >
        <option value="all">
          {t("all_items")}
        </option>

        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">{t("all_status")}</option>
        <option value="available">{t("available")}</option>
        <option value="low">{t("low_stock")}</option>
        <option value="out">{t("out_of_stock")}</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="item">
          {t("sort_by_item")}
        </option>

        <option value="warehouse">
          {t("sort_by_warehouse")}
        </option>

        <option value="quantity_desc">
          {t("quantity_high_to_low")}
        </option>

        <option value="quantity_asc">
          {t("quantity_low_to_high")}
        </option>

        <option value="date_desc">
          {t("newest_update")}
        </option>

        <option value="date_asc">
          {t("oldest_update")}
        </option>
      </select>

      <button
        className="clear-filters-btn"
        onClick={clearFilters}
      >
        {t("clear_filters")}
      </button>
    </div>

    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3>{t("total_items")}</h3>
        <strong>{totalItems}</strong>
      </div>

      <div className="dashboard-card">
        <h3>{t("total_quantity")}</h3>
        <strong>{totalQuantity.toLocaleString()}</strong>
      </div>
    </div>

    <br />

    <div className="card table-wrapper">
      <table>
        <thead>
          <tr>
            <th>{t("warehouse")}</th>
            <th>{t("item")}</th>
            <th>{t("quantity")}</th>
            <th>{t("status")}</th>
            <th>{t("last_update")}</th>
          </tr>
        </thead>

        <tbody>
       {sortedRows.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: "#6B7280",
                }}
              >
                {t("no_inventory_data_found")}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, index) => (
              <tr key={index}>
                <td>
                  {row.warehouse_name ||
                    warehouses.find(
                      (w) =>
                        String(w.id) ===
                        String(warehouse)
                    )?.name ||
                    "-"}
                </td>

                <td>
                  {row.item_name ||
                    items.find(
                      (i) =>
                        String(i.id) ===
                        String(item)
                    )?.name ||
                    "-"}
                </td>

                <td>
                  {Number(
                    row.quantity || 0
                  ).toLocaleString()}
                </td>

                <td>
                  {t(
                    row.status?.toLowerCase() ||
                      "unknown"
                  )}
                </td>

                <td>
                  {row.last_date
                    ? row.last_date.slice(0, 10)
                    : "-"}
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

export default InventoryReportPage;