import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";


function ExpenseCategoriesPage() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);


  const loadCategories = async () => {
    try {
      const response = await apiFetch(
        "/expense-categories/"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          "Failed to load expense categories"
        );
      }

      setCategories(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      if (error.message !== "SESSION_EXPIRED") {
        console.error(
          "EXPENSE CATEGORIES LOAD ERROR:",
          error
        );
      }

      setCategories([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCategories();
  }, []);


  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setError("");
    setShowModal(true);
  };


  const openEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name || "");
    setError("");
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setName("");
    setError("");
  };


  const handleSave = async () => {
    setError("");

    if (!name.trim()) {
      setError(t("expense_category_name_required"));
      return;
    }

    setSaving(true);

    try {
      const url = editingCategory
        ? `/expense-categories/${editingCategory.id}/`
        : "/expense-categories/";

      const method = editingCategory
        ? "PATCH"
        : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        console.error(
          "EXPENSE CATEGORY SAVE ERROR:",
          data
        );

        setError(
          t("expense_category_save_failed")
        );

        return;
      }

      await loadCategories();
      closeModal();
    } catch (error) {
      if (error.message !== "SESSION_EXPIRED") {
        console.error(
          "EXPENSE CATEGORY SAVE ERROR:",
          error
        );

        setError(
          t("expense_category_save_failed")
        );
      }
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="loading-state">
        {t("loading")}
      </div>
    );
  }


  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("expense_categories")}
          </h1>

          <p className="page-subtitle">
            {t("manage_expense_categories_description")}
          </p>
        </div>

        <button
          className="add-btn"
          onClick={openCreateModal}
        >
          {t("add_expense_category")}
        </button>
      </div>


      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("category_name")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan="3"
                  className="empty-state"
                >
                  {t("no_expense_categories")}
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>

                  <td>{category.name}</td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() =>
                        openEditModal(category)
                      }
                    >
                      {t("edit")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {showModal && (
        <div className="modal-overlay">
          <div className="modal">

            <h2>
              {editingCategory
                ? t("edit_expense_category")
                : t("add_expense_category")}
            </h2>

            <label>
              {t("category_name")}
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder={t(
                "expense_category_name_placeholder"
              )}
              autoFocus
            />

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <div className="modal-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? t("saving")
                  : t("save")}
              </button>

              <button
                className="cancel-btn"
                onClick={closeModal}
                disabled={saving}
              >
                {t("cancel")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}


export default ExpenseCategoriesPage;