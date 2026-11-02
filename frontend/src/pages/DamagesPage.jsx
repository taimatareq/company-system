import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import DamageModal from "../components/DamageModal";
function DamagesPage() {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const [showDamageModal, setShowDamageModal] = useState(false);
    const [inventory, setInventory] = useState([]);

    const [damageWarehouse, setDamageWarehouse] = useState("");
    const [damageItem, setDamageItem] = useState("");
    const [damageQuantity, setDamageQuantity] = useState("");
    const [damageNotes, setDamageNotes] = useState("");
    const [damageError, setDamageError] = useState("");
  const loadInventory = async () => {
        try {
            const response = await apiFetch("/inventory/");
            const data = await response.json();

            if (!response.ok) {
            throw new Error("Failed to load inventory");
            }

            setInventory(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("INVENTORY ERROR:", error);
            setInventory([]);
        }
        };
  useEffect(() => {
    const loadDamages = async () => {
      try {
        const response = await apiFetch("/damages/");
        const data = await response.json();
        console.log("DAMAGES ONLY:", data);

        if (!response.ok) {
          throw new Error("Failed to load damages");
        }

        setDamages(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("DAMAGE LIST ERROR:", error);
        setDamages([]);
      } finally {
        setLoading(false);
      }
    };

    loadDamages();
    loadInventory();
  }, []);
  const handleCreateDamage = async () => {
  setDamageError("");

  if (
    !damageWarehouse ||
    !damageItem ||
    !damageQuantity
  ) {
    setDamageError(t("please_fill_all_fields"));
    return;
  }

  try {
    const response = await apiFetch("/damages/", {
      method: "POST",
      body: JSON.stringify({
        warehouse: Number(damageWarehouse),
        damage_date: new Date().toISOString(),
        notes: damageNotes || "",
        items: [
          {
            item: Number(damageItem),
            quantity: Number(damageQuantity),
          },
        ],
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("DAMAGE CREATE ERROR:", data);

      setDamageError(t("damage_create_failed"));
      return;
    }

    // إعادة تحميل سجل الإتلاف
    const damagesResponse = await apiFetch("/damages/");
    const damagesData = await damagesResponse.json();

    setDamages(
      Array.isArray(damagesData)
        ? damagesData
        : damagesData.results || []
    );

    // إعادة تحميل المخزون بعد الإتلاف
    await loadInventory();

    // تنظيف وإغلاق المودال
    setDamageWarehouse("");
    setDamageItem("");
    setDamageQuantity("");
    setDamageNotes("");
    setDamageError("");
    setShowDamageModal(false);
  } catch (error) {
    if (error.message !== "SESSION_EXPIRED") {
      console.error("DAMAGE CREATE ERROR:", error);
      setDamageError(t("damage_create_failed"));
    }
  }
};
  const filteredDamages = damages.filter((damage) => {
    const text = search.toLowerCase();

    return (
      damage.warehouse_name?.toLowerCase().includes(text) ||
      damage.created_by_name?.toLowerCase().includes(text) ||
      damage.notes?.toLowerCase().includes(text) ||
      damage.items?.some((item) =>
        item.item_name?.toLowerCase().includes(text)
      )
    );
  });

  const totalDamagedQuantity = damages.reduce(
    (total, damage) =>
      total +
      (damage.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ),
    0
  );

  return (
    <>
   <div className="page-header">
  <div>
    <h1 className="page-title">{t("damage_log")}</h1>
    <p className="page-subtitle">
      {t("damage_log_subtitle")}
    </p>
  </div>

  <button
    className="add-btn"
    onClick={() => setShowDamageModal(true)}
  >
    {t("add_damage")}
  </button>
</div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{damages.length}</h3>
          <p>{t("total_damage_operations")}</p>
        </div>

        <div className="stat-card">
          <h3>{totalDamagedQuantity}</h3>
          <p>{t("total_damaged_quantity")}</p>
        </div>
      </div>

      <div className="table-header">
        <div className="search-box">
          <input
            type="text"
            placeholder={t("search_damage_log")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-wrapper">
        {loading ? (
          <p>{t("loading_damage_log")}</p>
        ) : filteredDamages.length === 0 ? (
          <p>{t("no_damage_operations")}</p>
        ) : (
          <table>
            <thead>
              <tr>
               <th>{t("operation_number")}</th>
<th>{t("date")}</th>
<th>{t("warehouse")}</th>
<th>{t("item")}</th>
<th>{t("damaged_quantity")}</th>
<th>{t("notes")}</th>
<th>{t("created_by")}</th>
<th>{t("status")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredDamages.flatMap((damage) =>
                (damage.items || []).map((item, index) => (
                  <tr key={`${damage.id}-${item.id}`}>
                    <td>{index === 0 ? damage.id : ""}</td>

                    <td>
                      {index === 0 && damage.damage_date
                        ? new Date(damage.damage_date).toLocaleString()
                        : ""}
                    </td>

                    <td>
                      {index === 0 ? damage.warehouse_name : ""}
                    </td>

                    <td>{item.item_name}</td>

                    <td>{item.quantity}</td>

                    <td>
                      {index === 0 ? damage.notes || "-" : ""}
                    </td>

                    <td>
                      {index === 0
                        ? damage.created_by_name || "-"
                        : ""}
                    </td>

                    <td>
  {index === 0
    ? damage.is_applied
      ? t("applied")
      : t("not_applied")
    : ""}
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {showDamageModal && (
  <DamageModal
    inventory={inventory}
    damageWarehouse={damageWarehouse}
    setDamageWarehouse={setDamageWarehouse}
    damageItem={damageItem}
    setDamageItem={setDamageItem}
    damageQuantity={damageQuantity}
    setDamageQuantity={setDamageQuantity}
    damageNotes={damageNotes}
    setDamageNotes={setDamageNotes}
    damageError={damageError}
    setDamageError={setDamageError}
    selectedDamageStock={inventory.find(
      (row) =>
        String(row.warehouse) === String(damageWarehouse) &&
        String(row.item) === String(damageItem)
    )}
    handleCreateDamage={handleCreateDamage}
    onClose={() => {
      setShowDamageModal(false);
      setDamageWarehouse("");
      setDamageItem("");
      setDamageQuantity("");
      setDamageNotes("");
      setDamageError("");
    }}
  />
)}
    </>
  );
}

export default DamagesPage;