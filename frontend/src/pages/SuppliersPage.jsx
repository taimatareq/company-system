import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const loadData = () => {
    apiFetch("/suppliers/")
      .then((res) => res.json())
      .then((data) => {
        setSuppliers(
          Array.isArray(data)
            ? data
            : data.results || []
        );
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setAddress("");
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name || "");
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name) {
      alert(t("supplier_name_required"));
      return;
    }

    const url = editingSupplier
      ? `/suppliers/${editingSupplier.id}/`
      : "/suppliers/";

    const method = editingSupplier
      ? "PUT"
      : "POST";

    const response = await apiFetch(url, {
      method,
      body: JSON.stringify({
        name,
        phone,
        address,
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
          <h1 className="page-title">{t("suppliers")}</h1>
        <p className="page-subtitle">{t("manage_suppliers")}</p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <button
          className="add-btn"
          onClick={() => {
            localStorage.setItem("page", "administration");
            window.location.reload();
          }}
        >
          {t("back")}
        </button>

        <button className="add-btn" onClick={openAddModal}>
          {t("add_supplier")}
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("phone")}</th>
              <th>{t("address")}</th>
              <th>{t("action")}</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.phone || "-"}</td>
                <td>{supplier.address || "-"}</td>

                <td style={{ textAlign: "center" }}>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(supplier)}
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
            <h3>
              {editingSupplier ? t("edit_supplier") : t("add_supplier")}
            </h3>

            <input
              placeholder={t("name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              placeholder={t("phone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <input
              placeholder={t("address")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setShowModal(false)}
              >
                {t("cancel")}
              </button>

              <button
                className="modal-btn primary"
                onClick={handleSave}
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

export default SuppliersPage;