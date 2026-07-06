import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function SalesRepresentativesPage() {
  const { t } = useTranslation();
  const [reps, setReps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRep, setEditingRep] = useState(null);

  const [name, setName] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadData = () => {
    apiFetch("/sales-representatives/")
      .then((res) => res.json())
      .then((data) => {
        setReps(Array.isArray(data) ? data : data.results || []);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingRep(null);
    setName("");
    setCommissionRate("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (rep) => {
    setEditingRep(rep);
    setName(rep.name || "");
    setCommissionRate(rep.commission_rate || "");
    setIsActive(rep.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name) {
      alert(t("name_is_required"));
      return;
    }

    const url = editingRep
      ? `/sales-representatives/${editingRep.id}/`
      : "/sales-representatives/";

    const method = editingRep ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method,
      body: JSON.stringify({
        name,
        commission_rate: Number(commissionRate || 0),
        is_active: isActive,
      }),
    });

    if (!response.ok) {
      alert(t("save_failed"));
      return;
    }

    setShowModal(false);
    loadData();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("sales_representatives")}</h1>
          <p className="page-subtitle">{t("manage_sales_representatives")}</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "16px" }}>
        <button className="add-btn" onClick={() => {
          localStorage.setItem("page", "administration");
          window.location.reload();
        }}>
          {t("back")}
        </button>

        <button className="add-btn" onClick={openAddModal}>
          {t("add_sales_rep")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("commission_rate")}</th>
              <th>{t("status")}</th>
              <th>{("action")}</th>
            </tr>
          </thead>

          <tbody>
            {reps.map((rep) => (
              <tr key={rep.id}>
                <td>{rep.name}</td>
                <td>{rep.commission_rate}%</td>
                <td>{rep.is_active ? "Active" : "Inactive"}</td>
                <td style={{ textAlign: "center" }}>
                  <button className="edit-btn" onClick={() => openEditModal(rep)}>
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
            <h3>{editingRep ? t("edit_sales_rep") : t("add_sales_rep")}</h3>

            <input
              placeholder={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="number"
              placeholder={t("commission_rate")}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label>{t("active")}</label>
            </div>

            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowModal(false)}>
                {t("cancel")}
              </button>

              <button className="modal-btn primary" onClick={handleSave}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SalesRepresentativesPage;