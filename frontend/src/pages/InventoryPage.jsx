import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function InventoryPage() {
  const { t } = useTranslation();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceWarehouse, setBalanceWarehouse] = useState("all");
  const [balanceItem, setBalanceItem] = useState("all");
  const [balanceResult, setBalanceResult] = useState(null);
  const [balanceTable, setBalanceTable] = useState([]);

  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageWarehouse, setDamageWarehouse] = useState("");
  const [damageItem, setDamageItem] = useState("");
  const [damageQuantity, setDamageQuantity] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [damageError, setDamageError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedOperation, setSelectedOperation] = useState("all");

  const itemsPerPage = 5;

  const loadInventory = async () => {
    try {
      const response = await apiFetch("/inventory/");
      const data = await response.json();

      console.log("INVENTORY DATA:", data);

      const inventoryList = Array.isArray(data)
        ? data
        : data.results || [];

      inventoryList.sort((a, b) => b.id - a.id);
      setInventory(inventoryList);
    } catch (error) {
      console.error(error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = inventory.filter(
    (row) =>
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
    ...new Set(inventory.map((row) => row.operation_type)),
  ];

  const warehouseFilteredInventory =
    selectedWarehouse === "all"
      ? filteredInventory
      : filteredInventory.filter(
          (row) => row.warehouse_name === selectedWarehouse
        );

  const operationFilteredInventory =
    selectedOperation === "all"
      ? warehouseFilteredInventory
      : warehouseFilteredInventory.filter(
          (row) => row.operation_type === selectedOperation
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
    apiFetch(
      `/inventory/item-stock/?warehouse=${balanceWarehouse}&item=${balanceItem}`
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

  const handleCreateDamage = async () => {
    setDamageError("");

    if (!damageWarehouse || !damageItem || !damageQuantity) {
      setDamageError("يرجى اختيار المستودع والمادة وإدخال الكمية");
      return;
    }

    const quantity = Number(damageQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setDamageError("كمية التالف يجب أن تكون أكبر من صفر");
      return;
    }

    try {
      const response = await apiFetch("/damages/", {
        method: "POST",
        body: JSON.stringify({
          warehouse: Number(damageWarehouse),
          damage_date: new Date().toISOString(),
          notes: damageNotes,
          items: [
            {
              item: Number(damageItem),
              quantity,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("DAMAGE ERROR:", data);

        const stockError = Array.isArray(data.stock)
          ? data.stock[0]
          : data.stock;
        const quantityError = Array.isArray(data.quantity)
          ? data.quantity[0]
          : data.quantity;
        const detailError = Array.isArray(data.detail)
          ? data.detail[0]
          : data.detail;

        setDamageError(
          stockError ||
            quantityError ||
            detailError ||
            "فشل تسجيل التالف. تأكدي من الكمية المتوفرة."
        );
        return;
      }

      await loadInventory();

      setShowDamageModal(false);
      setDamageWarehouse("");
      setDamageItem("");
      setDamageQuantity("");
      setDamageNotes("");
      setDamageError("");
      setCurrentPage(1);

      alert("تم تسجيل التالف وخصمه من المخزون بنجاح");
    } catch (error) {
      console.error(error);
      setDamageError("حدث خطأ أثناء تسجيل التالف");
    }
  };

  const selectedDamageStock = inventory.find(
    (row) =>
      String(row.warehouse) === String(damageWarehouse) &&
      String(row.item) === String(damageItem)
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("inventory")}</h1>
          <p className="page-subtitle">{t("manage_stock_movements")}</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="add-btn"
            onClick={() => {
              setDamageError("");
              setShowDamageModal(true);
            }}
          >
            تسجيل تالف
          </button>

          <button
            className="add-btn"
            onClick={() => setShowBalanceModal(true)}
          >
            {t("check_balance")}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{inventory.length}</h3>
          <p>{t("total_movements")}</p>
        </div>

        <div className="stat-card">
          <h3>
            {inventory.filter((i) => i.operation_type === "purchase").length}
          </h3>
          <p>{t("purchases")}</p>
        </div>

        <div className="stat-card">
          <h3>
            {inventory.filter((i) => i.operation_type === "sale").length}
          </h3>
          <p>{t("sales")}</p>
        </div>

        <div className="stat-card">
          <h3>
            {inventory.filter((i) => i.operation_type === "damage").length}
          </h3>
          <p>{t("damages")}</p>
        </div>
      </div>

      <div className="table-header">
        <div className="search-box">
          <input
            type="text"
            placeholder={t("search_inventory")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
              {warehouse === "all" ? t("all_warehouses") : warehouse}
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
              {operation === "all" ? t("all_operations") : t(operation)}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrapper">
        {loading ? (
          <p>{t("loading_inventory")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{t("warehouse")}</th>
                <th>{t("item")}</th>
                <th>{t("movement_qty")}</th>
                <th>{t("quantity")}</th>
                <th>{t("operation_type")}</th>
                <th>{t("operation_date")}</th>
              </tr>
            </thead>

            <tbody>
              {currentInventory.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.warehouse_name}</td>
                  <td>{row.item_name}</td>
                  <td>{row.movement_qty}</td>
                  <td>{row.quantity}</td>
                  <td>{t(row.operation_type)}</td>
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
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={currentPage === 1}
          >
            {t("previous")}
          </button>

          <span>
            {t("page")} {currentPage} {t("of")} {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={currentPage === totalPages}
          >
            {t("next")}
          </button>
        </div>
      </div>

      {showDamageModal && (
        <div className="modal-overlay">
          <div className="balance-modal">
            <h2>تسجيل تالف</h2>

            <label>المستودع</label>
            <select
              value={damageWarehouse}
              onChange={(e) => {
                setDamageWarehouse(e.target.value);
                setDamageItem("");
                setDamageQuantity("");
                setDamageError("");
              }}
            >
              <option value="">اختر المستودع</option>

              {[
                ...new Map(
                  inventory.map((row) => [row.warehouse, row])
                ).values(),
              ].map((row) => (
                <option key={row.warehouse} value={row.warehouse}>
                  {row.warehouse_name}
                </option>
              ))}
            </select>

            <label>المادة</label>
            <select
              value={damageItem}
              onChange={(e) => {
                setDamageItem(e.target.value);
                setDamageQuantity("");
                setDamageError("");
              }}
              disabled={!damageWarehouse}
            >
              <option value="">اختر المادة</option>

              {[
                ...new Map(
                  inventory
                    .filter(
                      (row) =>
                        String(row.warehouse) === String(damageWarehouse)
                    )
                    .map((row) => [row.item, row])
                ).values(),
              ].map((row) => (
                <option key={row.item} value={row.item}>
                  {row.item_name}
                </option>
              ))}
            </select>

            {damageWarehouse && damageItem && (
              <div
                style={{
                  padding: "10px",
                  marginTop: "10px",
                  marginBottom: "10px",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                }}
              >
                الرصيد الحالي: <strong>{selectedDamageStock?.quantity ?? 0}</strong>
              </div>
            )}

            <label>كمية التالف</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={damageQuantity}
              onChange={(e) => {
                setDamageQuantity(e.target.value);
                setDamageError("");
              }}
              placeholder="أدخل كمية التالف"
            />

            <label>سبب التلف / ملاحظات</label>
            <textarea
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="مثال: كسر، انتهاء صلاحية..."
              rows="3"
            />

            {damageError && (
              <p style={{ color: "red", marginTop: "10px" }}>
                {damageError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
              }}
            >
              <button className="save-btn" onClick={handleCreateDamage}>
                حفظ التالف
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDamageModal(false);
                  setDamageWarehouse("");
                  setDamageItem("");
                  setDamageQuantity("");
                  setDamageNotes("");
                  setDamageError("");
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="modal-overlay">
          <div className="balance-modal">
            <h2>{t("check_balance")}</h2>

            <select
              value={balanceWarehouse}
              onChange={(e) => setBalanceWarehouse(e.target.value)}
            >
              <option value="all">{t("all_warehouses")}</option>

              {[
                ...new Map(
                  inventory.map((row) => [row.warehouse, row])
                ).values(),
              ].map((row) => (
                <option key={row.warehouse} value={row.warehouse}>
                  {row.warehouse_name}
                </option>
              ))}
            </select>

            <select
              value={balanceItem}
              onChange={(e) => setBalanceItem(e.target.value)}
            >
              <option value="all">{t("all_items")}</option>

              {[
                ...new Map(
                  inventory.map((row) => [row.item, row])
                ).values(),
              ].map((row) => (
                <option key={row.item} value={row.item}>
                  {row.item_name}
                </option>
              ))}
            </select>

            <button className="save-btn" onClick={handleCheckBalance}>
              {t("show_balance")}
            </button>

            {balanceResult && (
              <div className="balance-summary">
                <div className="balance-main-card">
                  <small>{t("current_quantity")}</small>
                  <h1>{balanceResult.stock}</h1>
                </div>

                <div className="balance-info-grid">
                  <div className="balance-info-card">
                    <small>{t("last_movement")}</small>
                    <h3>
                      {balanceResult.last_operation_type
                        ? t(balanceResult.last_operation_type)
                        : "-"}
                    </h3>
                  </div>

                  <div className="balance-info-card">
                    <small>{t("movement_qty")}</small>
                    <h3>{balanceResult.last_movement_qty}</h3>
                  </div>

                  <div className="balance-info-card">
                    <small>{t("last_date")}</small>
                    <h3>
                      {balanceResult.last_operation_date
                        ? new Date(
                            balanceResult.last_operation_date
                          ).toLocaleDateString()
                        : "-"}
                    </h3>
                  </div>

                  <div className="balance-info-card">
                    <small>{t("total_movements")}</small>
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
                        <th>{t("warehouse")}</th>
                      ) : (
                        <th>{t("item")}</th>
                      )}

                      <th>{t("quantity")}</th>
                      <th>{t("last_date")}</th>
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
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InventoryPage;
