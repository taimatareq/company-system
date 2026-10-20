import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function CashBoxesPage({
  setPage,
  setSelectedSalesInvoice,
}) {
  const { t, i18n } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [editName, setEditName] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [editingCashBox, setEditingCashBox] = useState(null);

  const [loading, setLoading] = useState(true);
  const [selectedCashBox, setSelectedCashBox] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const loadData = () => {
  setLoading(true);

  Promise.all([
    apiFetch("/cashboxes/"),
    apiFetch("/branches/"),
  ])
    .then((responses) => {
      console.log(
        "CashBoxes status:",
        responses[0].status
      );

      console.log(
        "Branches status:",
        responses[1].status
      );

      return Promise.all(
        responses.map((res) => res.json())
      );
    })
    .then(([boxesData, branchesData]) => {
      console.log("CASH BOXES:", boxesData);
      console.log("BRANCHES:", branchesData);

      setCashBoxes(
        Array.isArray(boxesData)
          ? boxesData
          : boxesData?.results || []
      );

      setBranches(
        Array.isArray(branchesData)
          ? branchesData
          : branchesData?.results || []
      );
    })
    .catch((error) => {
      console.error(
        "Error loading CashBoxes page:",
        error
      );
    })
    .finally(() => {
      setLoading(false);
    });
};

  useEffect(() => {
    loadData();
  }, []);
  // const handleEditCashBox = (box) => {
  //   setEditingCashBox(box);
  //   setName(box.name);
  //   setBranch(String(box.branch));
  // };
  const handleEditCashBox = (box) => {
  setEditingCashBox(box);
  setEditName(box.name);
  setEditBranch(String(box.branch));
};
const handleUpdateCashBox = async () => {
  if (!editName.trim()) {
    alert(t("please_enter_cash_box_name"));
    return;
  }

  if (!editBranch) {
    alert(t("please_select_branch"));
    return;
  }

  try {
    const response = await apiFetch(
      `/cashboxes/${editingCashBox.id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          branch: Number(editBranch),
          box_type: "cash",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("UPDATE CASH BOX ERROR:", data);
      alert(t("error_saving_cash_box"));
      return;
    }

    setEditingCashBox(null);
    setEditName("");
    setEditBranch("");

    await loadData();
  } catch (error) {
    console.error("Error updating cash box:", error);
    alert(t("error_saving_cash_box"));
  }
};
  const handleCreate = async () => {
  if (!name.trim()) {
    alert(t("please_enter_cash_box_name"));
    return;
  }

  if (!branch) {
    alert(t("please_select_branch"));
    return;
  }

  try {
    const response = await apiFetch("/cashboxes/", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        branch: Number(branch),
        box_type: "cash",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      alert(JSON.stringify(data));
      return;
    }

    setName("");
    setBranch("");
    setShowCreateModal(false);
    await loadData();
  } catch (error) {
    console.error("Error creating cash box:", error);
    alert(t("error_creating_cash_box"));
  }
};
  const handleViewTransactions = async (box) => {
      setSelectedCashBox(box);
      setTransactionsLoading(true);

      try {
        const response = await apiFetch(
          `/cashbox-transactions/?cash_box=${box.id}`
        );

        const data = await response.json();
         console.log("SELECTED CASH BOX ID:", box.id);
          console.log("TRANSACTIONS RESPONSE:", data);
        const list = Array.isArray(data)
          ? data
          : data?.results || [];

        setTransactions(list);
      } catch (error) {
        console.error(
          "Error loading cash box transactions:",
          error
        );
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };
   const getTransactionDescription = (description) => {
  if (!description) {
    return "-";
  }

  // New customer payment format
  if (description.startsWith("sales_payment:")) {
    const [, , invoiceId] = description.split(":");

    return `${t("customer_payment")} - ${t("invoice")} SI-${String(
      invoiceId
    ).padStart(4, "0")}`;
  }

  // New cash sale format
  if (description.startsWith("cash_sale:")) {
    const [, invoiceId] = description.split(":");

    return `${t("cash_sale")} - ${t("invoice")} SI-${String(
      invoiceId
    ).padStart(4, "0")}`;
  }

  // Expenses
  if (description.startsWith("expense:")) {
    const expenseId = description.split(":")[1];
    return `${t("expense")} #${expenseId}`;
  }

  // Old expense format
  if (description.startsWith("Expense #")) {
    const expenseId = description.replace("Expense #", "");
    return `${t("expense")} #${expenseId}`;
  }

  // Old customer payment format
  if (description.startsWith("Customer payment - Invoice ")) {
    const invoiceNumber = description.replace(
      "Customer payment - Invoice ",
      ""
    );

    return `${t("customer_payment")} - ${t("invoice")} ${invoiceNumber}`;
  }

  // Old cash sale format
  if (description.startsWith("Cash sale - Invoice ")) {
    const invoiceNumber = description.replace(
      "Cash sale - Invoice ",
      ""
    );

    return `${t("cash_sale")} - ${t("invoice")} ${invoiceNumber}`;
  }

  return description;
};


const handleTransactionClick = (description) => {
  if (!description) {
    return;
  }

  // Customer payment -> receipt
  if (description.startsWith("sales_payment:")) {
  const [, paymentId] = description.split(":");

  const lang = i18n.resolvedLanguage?.startsWith("ar")
    ? "ar"
    : "en";

  window.open(
    `http://127.0.0.1:8000/api/sales-payments/${paymentId}/receipt/?lang=${lang}`,
    "_blank"
  );

  return;
}

  // Cash sale -> sales invoice details
  if (description.startsWith("cash_sale:")) {
    const [, invoiceId] = description.split(":");

    setSelectedSalesInvoice(Number(invoiceId));
    setPage("sales-invoice-detail");
  }
};
  return (
    <>
   <div className="page-header">
  <div>
    <h1 className="page-title">{t("cash_boxes")}</h1>
    <p className="page-subtitle">{t("manage_cash_boxes")}</p>
  </div>
</div>

<div className="page-actions">
  <button
    type="button"
    className="add-btn"
    onClick={() => {
      localStorage.setItem("page", "administration");
      window.location.reload();
    }}
  >
    {t("back")}
  </button>

  <button
    type="button"
    className="add-btn"
    onClick={() => setShowCreateModal(true)}  >
    {t("create_cash_box")}
  </button>
</div>

      {/* <div className="card">

        <div className="form-grid">

          <div className="form-group">
            <label>{t("cash_box_name")}</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("cash_box_name")}
            />
          </div>

          <div className="form-group">
            <label>{t("branch")}</label>

            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">
                {t("select_branch")}
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

        </div>


      </div> */}

      <div className="card table-wrapper">
        {loading ? (
          <p>{t("loading")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t("cash_box_name")}</th>
                <th>{t("branch")}</th>
                <th>{t("type")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>

            <tbody>
              {cashBoxes.map((box) => {
                const selectedBranch =
                  branches.find(
                    (branch) =>
                      Number(branch.id) ===
                      Number(box.branch)
                  );

                return (
                  <tr key={box.id}>
                    <td>{box.name}</td>

                    <td>
                      {selectedBranch?.name || "-"}
                    </td>

                    <td>{t("cash")}</td>
                   <td style={{ textAlign: "center" }}>
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <button
      type="button"
      className="edit-btn"
      onClick={() => handleEditCashBox(box)}
    >
      {t("edit")}
    </button>

    <button
      type="button"
      className="edit-btn"
      onClick={() => handleViewTransactions(box)}
    >
      {t("view_transactions")}
    </button>
  </div>
</td>
                  </tr>

                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {selectedCashBox && (
  <div className="card table-wrapper">
    <div className="page-header">
      <div>
        <h2>
          {t("cash_box_transactions")} - {selectedCashBox.name}
        </h2>

        <p>
          {t("current_balance")}: $
          {transactions
            .reduce((total, transaction) => {
              const amount = Number(transaction.amount || 0);

              return transaction.transaction_type === "in"
                ? total + amount
                : total - amount;
            }, 0)
            .toFixed(2)}
        </p>
      </div>
    </div>

    {transactionsLoading ? (
      <p>{t("loading")}</p>
    ) : transactions.length === 0 ? (
      <p>{t("no_transactions")}</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>{t("date")}</th>
            <th>{t("type")}</th>
            <th>{t("description")}</th>
            <th>{t("amount")}</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                {new Date(
                  transaction.created_at
                ).toLocaleString()}
              </td>

              <td>
                {transaction.transaction_type === "in"
                  ? t("money_in")
                  : t("money_out")}
              </td>

         <td
  onClick={() => {
    const description = transaction.description;

    if (
      description?.startsWith("sales_payment:") ||
      description?.startsWith("cash_sale:")
    ) {
      handleTransactionClick(description);
    }
  }}
  style={
    transaction.description?.startsWith("sales_payment:") ||
    transaction.description?.startsWith("cash_sale:")
      ? {
          cursor: "pointer",
          color: "#078b9a",
          textDecoration: "underline",
          fontWeight: "600",
        }
      : {}
  }
>
  {getTransactionDescription(transaction.description)}
</td>

              <td>
                {transaction.transaction_type === "in"
                  ? "+"
                  : "-"}
                ${Number(transaction.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
)}
{editingCashBox && (
  <div className="modal-overlay">
    <div className="damage-modal">
      <h2>{t("edit_cash_box")}</h2>

      <label>{t("cash_box_name")}</label>
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
      />

      <label>{t("branch")}</label>
      <select
        value={editBranch}
        onChange={(e) => setEditBranch(e.target.value)}
      >
        <option value="">{t("select_branch")}</option>

        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          onClick={handleUpdateCashBox}
        >
          {t("save_changes")}
        </button>

        <button
          type="button"
          className="cancel-btn"
          onClick={() => setEditingCashBox(null)}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  </div>
)}
{showCreateModal && (
  <div className="modal-overlay">
    <div className="damage-modal">
      <h2>{t("create_cash_box")}</h2>

      <label>{t("cash_box_name")}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label>{t("branch")}</label>
      <select
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
      >
        <option value="">{t("select_branch")}</option>

        {branches.map((branchItem) => (
          <option key={branchItem.id} value={branchItem.id}>
            {branchItem.name}
          </option>
        ))}
      </select>

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          onClick={handleCreate}
        >
          {t("create")}
        </button>

        <button
          type="button"
          className="cancel-btn"
          onClick={() => {
            setShowCreateModal(false);
            setName("");
            setBranch("");
          }}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}

export default CashBoxesPage;