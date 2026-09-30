import { apiFetch } from "../../api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function ItemForm({ editingItem, onSave, onCancel }) {
  const { t } = useTranslation();
  const [generateBarcode, setGenerateBarcode] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeStatus, setBarcodeStatus] = useState(null);
  const [existingItem, setExistingItem] = useState(null);
  const [checkingBarcode, setCheckingBarcode] = useState(false);
  const [itemType, setItemType] = useState("product");
  const [retailPrice, setRetailPrice] = useState("");
  const [retailTaxRate, setRetailTaxRate] = useState("0");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleTaxRate, setWholesaleTaxRate] = useState("0");

  useEffect(() => {
    if (editingItem) {
      setGenerateBarcode(false);
      setName(editingItem.name || "");
      setCode(editingItem.code || "");
      setBarcode(editingItem.barcode || "");
      setBarcodeStatus(null);
      setExistingItem(null);
      setRetailPrice(editingItem.retail_price || "");
      setRetailTaxRate(editingItem.retail_tax_rate || "");
      setWholesalePrice(editingItem.wholesale_price || "");
      setWholesaleTaxRate(editingItem.wholesale_tax_rate || "");
      setItemType(editingItem.item_type || "product");
    } else {
      setGenerateBarcode(false);
      setName("");
      setCode("");
      setBarcode("");
      setBarcodeStatus(null);
      setExistingItem(null);
      setRetailPrice("");
      setRetailTaxRate("0");
      setWholesalePrice("");
      setWholesaleTaxRate("0");
      setItemType("product");
    }
  }, [editingItem]);
const checkBarcode = async (value) => {
  const cleanBarcode = value.trim();

  if (!cleanBarcode) {
    setBarcodeStatus(null);
    setExistingItem(null);
    return;
  }

  // إذا كنا نعدل نفس المادة ولم يتغير الباركود
  // فلا نعتبره مكررًا
  if (
    editingItem &&
    cleanBarcode === editingItem.barcode
  ) {
    setBarcodeStatus("available");
    setExistingItem(null);
    return;
  }

  try {
    setCheckingBarcode(true);

    const response = await apiFetch(
      `/items/by-barcode/?barcode=${encodeURIComponent(cleanBarcode)}`
    );

    const data = await response.json();

    if (!response.ok) {
      setBarcodeStatus(null);
      setExistingItem(null);
      return;
    }

    if (data.exists) {
      setBarcodeStatus("exists");
      setExistingItem(data.item);
    } else {
      setBarcodeStatus("available");
      setExistingItem(null);
    }
  } catch (error) {
    console.error("Barcode check error:", error);
    setBarcodeStatus(null);
    setExistingItem(null);
  } finally {
    setCheckingBarcode(false);
  }
};
const handleSubmit = async () => {
  if (
    name.trim() === "" ||
    retailPrice === "" ||
    wholesalePrice === ""
  ) {
    setFormError(t("please_fill_all_fields"));
    return;
  }

  setFormError("");

  if (barcodeStatus === "exists") {
    setFormError(t("barcode_already_exists"));
    return;
  }
    if (
        name.trim() === "" ||
        retailPrice === "" ||
        wholesalePrice === ""
      ) {
        setFormError(t("please_fill_all_fields"));
        return;
      }

      setFormError("");
    // فحص نهائي للباركود قبل الحفظ
    if (!generateBarcode && barcode.trim()) {
      try {
        const response = await apiFetch(
          `/items/by-barcode/?barcode=${encodeURIComponent(barcode.trim())}`
        );

        const data = await response.json();

        if (data.exists) {
          // إذا كان الباركود لمادة ثانية نوقف الحفظ
          if (!editingItem || data.item.id !== editingItem.id) {
            setBarcodeStatus("exists");
            setExistingItem(data.item);
            return;
          }
        }

        setBarcodeStatus("available");
        setExistingItem(null);

      } catch (error) {
        console.error("Barcode check error:", error);
        return;
      }
    }
    const itemData = {
      name,
      barcode: generateBarcode ? null : barcode.trim(),
      generate_barcode: generateBarcode,
      retail_price: Number(retailPrice),
      wholesale_price: Number(wholesalePrice),
      retail_tax_rate: Number(retailTaxRate || 0),
      wholesale_tax_rate: Number(wholesaleTaxRate || 0),
      item_type: itemType,
    };

    onSave(itemData);
  };

  return (
    <div>
      <h2 className="form-title">
        {editingItem ? t("edit_item") : t("add_item")}
      </h2>

      <div className="item-form-layout">

  {/* BASIC INFORMATION */}
  <div className="item-full-field">
    <label>{t("name")}</label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder={t("enter_item_name")}
    />
  </div>

  <div className="item-full-field">
    <label>{t("item_type")}</label>
    <select
      value={itemType}
      onChange={(e) => setItemType(e.target.value)}
    >
      <option value="product">{t("product")}</option>
      <option value="service">{t("service")}</option>
    </select>
  </div>

  {/* BARCODE */}
  <div className="item-full-field">
    <label>{t("barcode")}</label>

    <input
      type="text"
      value={barcode}
      disabled={generateBarcode}
      onChange={(e) => {
        setBarcode(e.target.value);
        setBarcodeStatus(null);
        setExistingItem(null);
      }}
      onBlur={(e) => checkBarcode(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkBarcode(e.currentTarget.value);
        }
      }}
      placeholder={t("scan_or_enter_barcode")}
    />

    {checkingBarcode && (
      <small>{t("checking_barcode")}</small>
    )}

    {barcodeStatus === "available" && (
      <small className="barcode-available">
        ✓ {t("barcode_available")}
      </small>
    )}

    {barcodeStatus === "exists" && existingItem && (
      <div className="barcode-exists">
        ⚠️ {t("item_already_exists")}:{" "}
        <strong>{existingItem.name}</strong>
      </div>
    )}

    <div className="barcode-auto-row">
      <span>{t("auto_generate_barcode")}</span>

      <label className="switch">
        <input
          type="checkbox"
          checked={generateBarcode}
          onChange={(e) => {
            const checked = e.target.checked;

            setGenerateBarcode(checked);

            if (checked) {
              setBarcode("");
              setBarcodeStatus(null);
              setExistingItem(null);
            }
          }}
        />

        <span className="slider"></span>
      </label>
    </div>
  </div>

  {/* PRICING */}
  <div className="item-section-title">
    <span>{t("pricing")}</span>
  </div>

  <div className="item-pricing-grid">

    <div className="form-group">
      <label>{t("retail_price")}</label>
      <input
        type="number"
        step="0.01"
        value={retailPrice}
        onChange={(e) => setRetailPrice(e.target.value)}
        placeholder="0.00"
      />
    </div>

    <div className="form-group">
      <label>{t("retail_tax")}</label>
      <input
        type="number"
        step="0.01"
        value={retailTaxRate}
        onChange={(e) => setRetailTaxRate(e.target.value)}
        placeholder="0"
      />
    </div>

    <div className="form-group">
      <label>{t("wholesale_price")}</label>
      <input
        type="number"
        step="0.01"
        value={wholesalePrice}
        onChange={(e) => setWholesalePrice(e.target.value)}
        placeholder="0.00"
      />
    </div>

    <div className="form-group">
      <label>{t("wholesale_tax")}</label>
      <input
        type="number"
        step="0.01"
        value={wholesaleTaxRate}
        onChange={(e) => setWholesaleTaxRate(e.target.value)}
        placeholder="0"
      />
    </div>

  </div>
</div>
          {formError && (
  <div className="form-error-message">
    ⚠️ {formError}
  </div>
)}
      <div className="form-actions">
        <button className="save-btn" onClick={handleSubmit}>
          {t("save")}
        </button>

        <button className="cancel-btn" onClick={onCancel}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}

export default ItemForm;