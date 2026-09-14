import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
function ItemForm({ editingItem, onSave, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  
  const [itemType, setItemType] = useState("product");
  const [retailPrice, setRetailPrice] = useState("");
  const [retailTaxRate, setRetailTaxRate] = useState("");

  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleTaxRate, setWholesaleTaxRate] = useState("");

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || "");
      setCode(editingItem.code || "");
      setRetailPrice(editingItem.retail_price || "");
      setRetailTaxRate(editingItem.retail_tax_rate || "");
      setWholesalePrice(editingItem.wholesale_price || "");
      setWholesaleTaxRate(editingItem.wholesale_tax_rate || "");
      setItemType(editingItem.item_type || "product");
    } else {
      setName("");
      setCode("");
      setRetailPrice("");
      setRetailTaxRate("");
      setWholesalePrice("");
      setWholesaleTaxRate("");
      setItemType("product");
    }
  }, [editingItem]);

  const handleSubmit = () => {
    if (
      name.trim() === "" ||
      retailPrice === "" ||
      retailTaxRate === "" ||
      wholesalePrice === "" ||
      wholesaleTaxRate === ""
    ) {
      alert(t("please_fill_all_fields"));
      return;
    }

    const itemData = {
      name,
      retail_price: Number(retailPrice),
      retail_tax_rate: Number(retailTaxRate),
      wholesale_price: Number(wholesalePrice),
      wholesale_tax_rate: Number(wholesaleTaxRate),
      item_type: itemType,
    };

    onSave(itemData);
  };

  return (
    <div>
      <h2 className="form-title">
        {editingItem ? t("edit_item") : t("add_item")}
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label>{t("name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("enter_item_name")}
          />
        </div>

        {/* <div className="form-group">
          <label>{t("code")}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("enter_item_code")}
          />
        </div> */}
        <div className="form-group">
        <label>{t("item_type")}</label>

        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
        >
          <option value="product">
            {t("product")}
          </option>

          <option value="service">
            {t("service")}
          </option>
        </select>
      </div>
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