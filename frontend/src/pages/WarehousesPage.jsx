import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function WarehousesPage() {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [type,setType]=useState("main");
  const loadData = () => {
    Promise.all([
      apiFetch("/warehouses/"),
      apiFetch("/branches/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([warehousesData, branchesData]) => {
        setWarehouses(
          Array.isArray(warehousesData)
            ? warehousesData
            : warehousesData.results || []
        );

        setBranches(
          Array.isArray(branchesData)
            ? branchesData
            : branchesData.results || []
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingWarehouse(null);
    setName("");
    setType("main");
    setBranch("");
    setShowModal(true);
  };

  const openEditModal = (warehouse) => {
    setEditingWarehouse(warehouse);
    setName(warehouse.name || "");
    setType(warehouse.type||"main");
    setBranch(warehouse.branch || "");
    setShowModal(true);
  };

  const handleSaveWarehouse = async () => {
  if (!name) {
    alert("Warehouse name is required");
    return;
  }

  if (type === "branch" && !branch) {
    alert("Branch is required for branch warehouse");
    return;
  }

  const url = editingWarehouse
    ? `/warehouses/${editingWarehouse.id}/`
    : "/warehouses/";

  const method = editingWarehouse ? "PUT" : "POST";

  const response = await apiFetch(url, {
    method,
    body: JSON.stringify({
      name,
      type,
      branch: type === "branch" ? Number(branch) : null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    alert(JSON.stringify(error));
    return;
  }

  setShowModal(false);
  loadData();
};
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("warehouses")}</h1>
          <p className="page-subtitle">{t("manage_company_warehouses")}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button
className="add-btn"
onClick={()=>
localStorage.setItem(
"page",
"administration"
)
||
window.location.reload()
}
>

{t("back")}
</button> 
        <button className="add-btn" onClick={openAddModal}>
          {t("add_warehouse")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
  <thead>
    <tr>
      <th>{t("name")}</th>
      <th>{t("type")}</th>
      <th>{t("branch")}</th>
      <th>{t("action")}</th>
    </tr>
  </thead>

  <tbody>
    {warehouses.map((warehouse) => (
      <tr key={warehouse.id}>
        <td>{warehouse.name}</td>

        <td>
          {warehouse.type === "main"
            ? t("main_warehouse")
            : t("branch_warehouse")}
        </td>

        <td>
          {warehouse.type === "main"
            ? "-"
            : branches.find((b) => b.id === warehouse.branch)?.name || "-"}
        </td>

        <td style={{ textAlign: "center" }}>
          <button
            style={{
              background: "#9CA3AF",
              color: "white",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => openEditModal(warehouse)}
          >
            {t("edit")}
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingWarehouse ? t("edit_warehouse") : t("add_warehouse")}</h3>

            <input
              placeholder={t("warehouse_name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

           <select
  value={type}
  onChange={(e) => {
    const value = e.target.value;
    setType(value);

    if (value === "main") {
      setBranch("");
    }
  }}
>
  <option value="main">{t("main_warehouse")}</option>
  <option value="branch">{t("branch_warehouse")}</option>
</select>

{type === "branch" && (
  <select
    value={branch}
    onChange={(e) => setBranch(e.target.value)}
  >
    <option value="">{t("Select_branch")}</option>

    {branches.map((branch) => (
      <option key={branch.id} value={branch.id}>
        {branch.name}
      </option>
    ))}
  </select>
)}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setShowModal(false)}
              >
                {t("cancel")}
              </button>

              <button
                className="modal-btn primary"
                onClick={handleSaveWarehouse}
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WarehousesPage;