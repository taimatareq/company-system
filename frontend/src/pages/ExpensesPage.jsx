import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";


function ExpensesPage() {
  const { t } = useTranslation();
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState("");
  const [cashBox, setCashBox] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

  const loadExpenses = async () => {
    try {
      const response = await apiFetch("/expenses/");
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to load expenses");
      }

      setExpenses(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      if (error.message !== "SESSION_EXPIRED") {
        console.error("EXPENSES LOAD ERROR:", error);
      }

      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };
  const loadFormData = async () => {
  try {
    const [
      categoriesResponse,
      branchesResponse,
      cashBoxesResponse,
    ] = await Promise.all([
      apiFetch("/expense-categories/"),
      apiFetch("/branches/"),
      apiFetch("/cashboxes/"),
    ]);

    const categoriesData =
      await categoriesResponse.json();

    const branchesData =
      await branchesResponse.json();

    const cashBoxesData =
      await cashBoxesResponse.json();

    setCategories(
      Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData.results || []
    );

    setBranches(
      Array.isArray(branchesData)
        ? branchesData
        : branchesData.results || []
    );

    setCashBoxes(
      Array.isArray(cashBoxesData)
        ? cashBoxesData
        : cashBoxesData.results || []
    );
  } catch (error) {
    if (error.message !== "SESSION_EXPIRED") {
      console.error(
        "EXPENSE FORM DATA ERROR:",
        error
      );
    }
  }
};
 useEffect(() => {
    loadExpenses();
    loadFormData();
    }, []);
    const handleSaveExpense = async () => {
  setError("");

  if (
    !category ||
    !branch ||
    !cashBox ||
    !amount ||
    !expenseDate
  ) {
    setError(t("expense_required_fields"));
    return;
  }

  if (Number(amount) <= 0) {
    setError(t("expense_amount_invalid"));
    return;
  }

  setSaving(true);

  try {
    const url = editingExpense
      ? `/expenses/${editingExpense.id}/`
      : "/expenses/";

    const method = editingExpense
      ? "PATCH"
      : "POST";

    const response = await apiFetch(url, {
      method,
      body: JSON.stringify({
        category: Number(category),
        branch: Number(branch),
        cash_box: Number(cashBox),
        amount: amount,
        currency: currency,
        expense_date: expenseDate,
        notes: notes.trim() || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();

      console.error(
        "EXPENSE SAVE ERROR:",
        data
      );

      setError(t("expense_save_failed"));
      return;
    }

    await loadExpenses();

    setCategory("");
    setBranch("");
    setCashBox("");
    setAmount("");
    setCurrency("USD");
    setExpenseDate("");
    setNotes("");
    setEditingExpense(null);
    setError("");
    setShowModal(false);

  } catch (error) {
    if (error.message !== "SESSION_EXPIRED") {
      console.error(
        "EXPENSE SAVE ERROR:",
        error
      );

      setError(t("expense_save_failed"));
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
        <h1>{t("expenses")}</h1>
    </div>

    <button
  className="add-btn"
  onClick={() => {
    setEditingExpense(null);
    setCategory("");
    setBranch("");
    setCashBox("");
    setAmount("");
    setCurrency("USD");
    setExpenseDate("");
    setNotes("");
    setError("");
    setShowModal(true);
  }}
>
  {t("add_expense")}
</button>
    </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t("category")}</th>
              <th>{t("branch")}</th>
              <th>{t("cash_box")}</th>
              <th>{t("amount")}</th>
              <th>{t("currency")}</th>
              <th>{t("date")}</th>
              <th>{t("created_by")}</th>
              <th>{t("notes")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  {t("no_expenses")}
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.category_name || "-"}</td>

                  <td>{expense.branch_name || "-"}</td>

                  <td>{expense.cash_box_name || "-"}</td>

                  <td>{expense.amount}</td>

                  <td>{expense.currency}</td>

                  <td>
                    {expense.expense_date
                      ? new Date(
                          expense.expense_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {expense.created_by_name || "-"}
                  </td>

                  <td>{expense.notes || "-"}</td>
                  <td>
  <button
    className="edit-btn"
    onClick={() => {
      setEditingExpense(expense);

      setCategory(String(expense.category));
      setBranch(String(expense.branch));
      setCashBox(String(expense.cash_box));
      setAmount(expense.amount);
      setCurrency(expense.currency || "USD");

      setExpenseDate(
        expense.expense_date
          ? expense.expense_date.slice(0, 16)
          : ""
      );

      setNotes(expense.notes || "");
      setError("");
      setShowModal(true);
    }}
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
    <div className="damage-modal">
<h2>
  {editingExpense
    ? t("edit_expense")
    : t("add_expense")}
</h2>
      <label>{t("category")}</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">
          {t("select_category")}
        </option>

        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <label>{t("branch")}</label>
      <select
        value={branch}
        onChange={(e) => {
          setBranch(e.target.value);
          setCashBox("");
        }}
        disabled={!!editingExpense}
      >
        <option value="">
          {t("select_branch")}
        </option>

        {branches.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <label>{t("cash_box")}</label>
      <select
        value={cashBox}
        onChange={(e) => setCashBox(e.target.value)}
        disabled={!!editingExpense}
      >
        <option value="">
          {t("select_cash_box")}
        </option>

        {cashBoxes
          .filter(
            (item) =>
              !branch ||
              String(item.branch) === String(branch)
          )
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </select>

      <label>{t("amount")}</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={!!editingExpense}
      />

      <label>{t("currency")}</label>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        disabled={!!editingExpense}

      >
        <option value="USD">USD</option>
        <option value="SYP">SYP</option>
      </select>

      <label>{t("date")}</label>
      <input
        type="datetime-local"
        value={expenseDate}
        onChange={(e) =>
          setExpenseDate(e.target.value)
        }
        disabled={!!editingExpense}
      />

      <label>{t("notes")}</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button
  className="save-btn"
  onClick={handleSaveExpense}
  disabled={saving}
>
  {saving ? t("saving") : t("save")}
</button>

        <button
          className="cancel-btn"
          onClick={() => {
            setShowModal(false);
            setError("");
          }}
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

export default ExpensesPage;