import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function POSPage() {
  const { t } = useTranslation();
  const [posList, setPosList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingPOS, setEditingPOS] = useState(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branch, setBranch] = useState("");
  const [warehouse, setWarehouse] = useState("");

  const loadData = () => {
    Promise.all([
      apiFetch("/pos/"),
      apiFetch("/branches/"),
      apiFetch("/warehouses/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((res) => res.json()))
      )
      .then(([posData, branchesData, warehousesData]) => {
        setPosList(Array.isArray(posData) ? posData : posData.results || []);
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.results || []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : warehousesData.results || []);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPOS(null);
    setName("");
    setCode("");
    setBranch("");
    setWarehouse("");
    setShowModal(true);
  };

  const openEditModal = (pos) => {
    setEditingPOS(pos);
    setName(pos.name || "");
    setCode(pos.code || "");
    setBranch(pos.branch || "");
    setWarehouse(pos.warehouse || "");
    setShowModal(true);
  };

  const handleSavePOS = async () => {
    if (!name || !code || !branch || !warehouse) {
      alert(t("all_fields_are_required"));
      return;
    }

    const url = editingPOS ? `/pos/${editingPOS.id}/` : "/pos/";
    const method = editingPOS ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method,
      body: JSON.stringify({
        name,
        code,
        branch: Number(branch),
        warehouse: Number(warehouse),
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
  const filteredWarehouses =
  warehouses.filter(
  (w)=>
  String(w.branch)===String(branch)
  ||
  !branch
  );
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("pos")}</h1>
          <p className="page-subtitle">{t("manage_pos_stations")}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
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
          {t("add_pos")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("code")}</th>
              <th>{t("branch")}</th>
              <th>{t("warehouse")}</th>
              <th>{t("action")}</th>
            </tr>
          </thead>

          <tbody>
            {posList.map((pos) => (
              <tr key={pos.id}>
                <td>{pos.name}</td>
                <td>{pos.code}</td>
                <td>{pos.branch_name || "-"}</td>
                <td>{pos.warehouse_name || "-"}</td>
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
                    onClick={() => openEditModal(pos)}
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
            <h3>{editingPOS ? t("edit_pos") : t("add_pos")}</h3>

            <input
              placeholder={t("pos_name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              placeholder={t("code")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">{t("select_branch")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="">{t("select_warehouse")}</option>
              {filteredWarehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowModal(false)}>
                {t("cancel")}
              </button>

              <button className="modal-btn primary" onClick={handleSavePOS}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default POSPage;