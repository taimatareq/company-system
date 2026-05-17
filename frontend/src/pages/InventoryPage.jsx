import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000/api";

// const token =
//   localStorage.getItem("access_token");

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceWarehouse, setBalanceWarehouse] = useState("");
  const [balanceItem, setBalanceItem] = useState("");
  const [balanceResult, setBalanceResult] = useState(null);
  const [balanceTable, setBalanceTable] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    fetch(`${API_URL}/inventory/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("INVENTORY DATA:", data);

        const inventoryList = Array.isArray(data) ? data : data.results;
        inventoryList.sort(
          (a, b) => b.id - a.id
        );
        setInventory(inventoryList || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setInventory([]);
        setLoading(false);
      });
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
const [selectedWarehouse, setSelectedWarehouse] = useState("all");

const itemsPerPage = 5;

const filteredInventory = inventory.filter((row) =>
  row.item_name?.toLowerCase().includes(search.toLowerCase()) ||
  row.warehouse_name?.toLowerCase().includes(search.toLowerCase()) ||
  row.operation_type?.toLowerCase().includes(search.toLowerCase())
);

const warehouses = [
  "all",
  ...new Set(inventory.map((row) => row.warehouse_name)),
];
const operations = [
  "all",
  ...new Set(
    inventory.map(
      (row) => row.operation_type
    )
  ),
];

const [selectedOperation, setSelectedOperation] =
  useState("all");
const warehouseFilteredInventory =
  selectedWarehouse === "all"
    ? filteredInventory
    : filteredInventory.filter(
        (row) =>
          row.warehouse_name ===
          selectedWarehouse
      );

const operationFilteredInventory =
  selectedOperation === "all"
    ? warehouseFilteredInventory
    : warehouseFilteredInventory.filter(
        (row) =>
          row.operation_type ===
          selectedOperation
      );

const totalPages =
  Math.ceil(operationFilteredInventory.length / itemsPerPage) || 1;

const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;

const currentInventory = operationFilteredInventory.slice(
  startIndex,
  endIndex
);
const handleCheckBalance = () => {
  if (balanceWarehouse === "" || balanceItem === "") {
  alert("Please select warehouse and item");
  return;
}

const token = localStorage.getItem("access_token");

  fetch(
    `${API_URL}/inventory/item-stock/?warehouse=${balanceWarehouse}&item=${balanceItem}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => {
      console.log("BALANCE DATA:", data);
      if (Array.isArray(data)) {
        setBalanceTable(data);
        setBalanceResult(null);
    } else {
        setBalanceResult(data);
        setBalanceTable([]);
}
    })
    .catch((err) => {
      console.error(err);
    });
};
return (
    <div className="main">

      <div className="page-header">

        <div>
        
          <h1 className="page-title">
            Inventory
          </h1>

          <p className="page-subtitle">
            Manage stock movements
          </p>

        </div>
<button
          className="add-btn"
          onClick={() => setShowBalanceModal(true)}
        >
          Check Balance
        </button>
      </div>
      
<div className="stats-grid">

  <div className="stat-card">

    <h3>
      {inventory.length}
    </h3>

    <p>Total Movements</p>

  </div>

  <div className="stat-card">

    <h3>
      {
        inventory.filter(
          (i) =>
            i.operation_type === "purchase"
        ).length
      }
    </h3>

    <p>Purchases</p>

  </div>

  <div className="stat-card">

    <h3>
      {
        inventory.filter(
          (i) =>
            i.operation_type === "sale"
        ).length
      }
    </h3>

    <p>Sales</p>

  </div>

  <div className="stat-card">

    <h3>
      {
        inventory.filter(
          (i) =>
            i.operation_type === "damage"
        ).length
      }
    </h3>

    <p>Damages</p>

  </div>

</div>
< div className="table-header">
  <div className="search-box">
    <input
      type="text"
      placeholder="Search inventory..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    
  </div>
  <div className="filter-buttons">
  {warehouses.map((warehouse) => (
    <button
      key={warehouse}
      className={
        selectedWarehouse === warehouse
          ? "filter-btn active"
          : "filter-btn"
      }
      onClick={() => {
        setSelectedWarehouse(warehouse);
        setCurrentPage(1);
      }}
    >
      {warehouse === "all" ? "All Warehouses" : warehouse}
    </button>
  ))}
</div>
<div className="filter-buttons">

  {operations.map((operation) => (

    <button
      key={operation}
      className={
        selectedOperation === operation
          ? "filter-btn active"
          : "filter-btn"
      }
      onClick={() => {
        setSelectedOperation(operation);
        setCurrentPage(1);
      }}
    >

      {operation === "all"
        ? "All Operations"
        : operation}

    </button>

  ))}

</div>
</div>
      <div className="card table-wrapper">

        {loading ? (

          <p>
            Loading inventory...
          </p>

        ) : (

          <table>

            <thead>

              <tr>

                <th>ID</th>

                <th>Warehouse</th>
                <th>Item</th>
                <th>Movement Qty</th>
                <th>Quantity</th>
                <th>Operation Type</th>
                <th>Operation Date</th>

              </tr>

            </thead>

            <tbody>

              {currentInventory.map((row) => (

                <tr key={row.id}>

                  <td>
                    {row.id}
                  </td>

                  <td>{row.warehouse_name}</td>
                  <td>{row.item_name}</td>
                  <td>{row.movement_qty}</td>
                  <td>{row.quantity}</td>
                  <td>{row.operation_type}</td>
                  <td>
                  {row.operation_date
                    ? new Date(row.operation_date).toLocaleDateString()
                    : "-"}
                  </td>
                </tr>

              ))}

            </tbody>

          </table>

        )}
<div className="pagination">

  <button
    onClick={() =>
      setCurrentPage(
        currentPage - 1
      )
    }
    disabled={
      currentPage === 1
    }
  >
    Previous
  </button>

  <span>
    Page {currentPage} of{" "}
    {totalPages || 1}
  </span>

  <button
    onClick={() =>
      setCurrentPage(
        currentPage + 1
      )
    }
    disabled={
      currentPage ===
      totalPages
    }
  >
    Next
  </button>

</div>
      </div>
{showBalanceModal && (
  <div className="modal-overlay">
    <div className="balance-modal">
      <h2>Check Balance</h2>

      <select
        value={balanceWarehouse}
        onChange={(e) => setBalanceWarehouse(e.target.value)}
      >
        <option value="all">All Warehouses</option>
        {[...new Map(inventory.map(row => [row.warehouse, row])).values()].map((row) => (
          <option key={row.warehouse} value={row.warehouse}>
            {row.warehouse_name}
          </option>
        ))}
      </select>

      <select
        value={balanceItem}
        onChange={(e) => setBalanceItem(e.target.value)}
      >
        <option value="all">All Items</option>
        {[...new Map(inventory.map(row => [row.item, row])).values()].map((row) => (
          <option key={row.item} value={row.item}>
            {row.item_name}
          </option>
        ))}
      </select>

      <button className="save-btn" onClick={handleCheckBalance}>
        Show Balance
      </button>
{balanceResult && (
  <div className="balance-summary">
    <div className="balance-main-card">
      <small>Current Quantity</small>
      <h1>{balanceResult.stock}</h1>
    </div>

    <div className="balance-info-grid">
      <div className="balance-info-card">
        <small>Last Movement</small>
        <h3>{balanceResult.last_operation_type || "-"}</h3>
      </div>

      <div className="balance-info-card">
        <small>Movement Qty</small>
        <h3>{balanceResult.last_movement_qty}</h3>
      </div>

      <div className="balance-info-card">
        <small>Last Date</small>
        <h3>
          {balanceResult.last_operation_date
            ? new Date(balanceResult.last_operation_date).toLocaleDateString()
            : "-"}
        </h3>
      </div>

      <div className="balance-info-card">
        <small>Total Movements</small>
        <h3>{balanceResult.total_movements}</h3>
      </div>
    </div>
  </div>
)}
      {balanceTable.length > 0 && (
  <div className="balance-table-wrapper">
    <table className="balance-table">
      <thead>
        <tr>
          {balanceWarehouse === "all" ? (
            <th>Warehouse</th>
          ) : (
            <th>Item</th>
          )}
          <th>Quantity</th>
          <th>Last Date</th>
        </tr>
      </thead>

      <tbody>
        {balanceTable.map((row, index) => (
          <tr key={index}>
            <td>
              {balanceWarehouse === "all"
                ? row.warehouse_name
                : row.item_name}
            </td>
            <td>{row.quantity}</td>
            <td>
              {row.last_date
                ? new Date(row.last_date).toLocaleDateString()
                : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      <button
        className="cancel-btn"
        onClick={() => {
          setShowBalanceModal(false);
          setBalanceResult(null);
          setBalanceTable([]);
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>

  );

}

export default InventoryPage;