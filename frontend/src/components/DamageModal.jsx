import { useTranslation } from "react-i18next";

function DamageModal({
  inventory,
  damageWarehouse,
  setDamageWarehouse,
  damageItem,
  setDamageItem,
  damageQuantity,
  setDamageQuantity,
  damageNotes,
  setDamageNotes,
  damageError,
  setDamageError,
  selectedDamageStock,
  handleCreateDamage,
  onClose,
}) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay">
      <div className="damage-modal">
        <h2>{t("register_damage")}</h2>

        <label>{t("warehouse")}</label>
        <select
          value={damageWarehouse}
          onChange={(e) => {
            setDamageWarehouse(e.target.value);
            setDamageItem("");
            setDamageQuantity("");
            setDamageError("");
          }}
        >
          <option value="">{t("select_warehouse")}</option>

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

        <label>{t("item")}</label>
        <select
          value={damageItem}
          onChange={(e) => {
            setDamageItem(e.target.value);
            setDamageQuantity("");
            setDamageError("");
          }}
          disabled={!damageWarehouse}
        >
          <option value="">{t("select_item")}</option>

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
            {t("current_stock")}:{" "}
            <strong>{selectedDamageStock?.quantity ?? 0}</strong>
          </div>
        )}

        <label>{t("damaged_quantity")}</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={damageQuantity}
          onChange={(e) => {
            setDamageQuantity(e.target.value);
            setDamageError("");
          }}
          placeholder={t("enter_damaged_quantity")}
        />

        <label>{t("damage_reason_notes")}</label>
        <textarea
          value={damageNotes}
          onChange={(e) => setDamageNotes(e.target.value)}
          placeholder={t("damage_notes_example")}
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
            {t("save_damage")}
          </button>

          <button className="cancel-btn" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DamageModal;