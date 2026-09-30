import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function CashBoxesPage() {
  const { t } = useTranslation();

  const [cashBoxes, setCashBoxes] = useState([]);
  const [branches, setBranches] = useState([]);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");

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
      const response = await apiFetch(
        "/cashboxes/",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            branch: Number(branch),
            box_type: "cash",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        alert(JSON.stringify(data));
        return;
      }

      setName("");
      setBranch("");

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
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("cash_boxes")}
          </h1>

          <p className="page-subtitle">
            {t("manage_cash_boxes")}
          </p>
        </div>
      </div>

      <div className="card">
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

        <button
          type="button"
          className="add-btn"
          onClick={handleCreate}
        >
          {t("create_cash_box")}
        </button>
      </div>

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
  <button
    type="button"
    className="add-btn"
    onClick={() => handleViewTransactions(box)}
  >
    {t("view_transactions")}
  </button>
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

              <td>
                {transaction.description || "-"}
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
    </>
  );
}

export default CashBoxesPage;