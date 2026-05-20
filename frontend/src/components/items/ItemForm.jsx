import { useEffect, useState } from "react";

function ItemForm({ editingItem, onSave, onCancel }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

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
    } else {
      setName("");
      setCode("");
      setRetailPrice("");
      setRetailTaxRate("");
      setWholesalePrice("");
      setWholesaleTaxRate("");
    }
  }, [editingItem]);

  const handleSubmit = () => {
    if (
      name.trim() === "" ||
      code.trim() === "" ||
      retailPrice === "" ||
      retailTaxRate === "" ||
      wholesalePrice === "" ||
      wholesaleTaxRate === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    const itemData = {
      name,
      code,
      retail_price: Number(retailPrice),
      retail_tax_rate: Number(retailTaxRate),
      wholesale_price: Number(wholesalePrice),
      wholesale_tax_rate: Number(wholesaleTaxRate),
    };

    onSave(itemData);
  };

  return (
    <div>
      <h2 className="form-title">
        {editingItem ? "Edit Item" : "Add Item"}
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter item name"
          />
        </div>

        <div className="form-group">
          <label>Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter item code"
          />
        </div>

        <div className="form-group">
          <label>Retail Price</label>
          <input
            type="number"
            step="0.01"
            value={retailPrice}
            onChange={(e) => setRetailPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Retail Tax %</label>
          <input
            type="number"
            step="0.01"
            value={retailTaxRate}
            onChange={(e) => setRetailTaxRate(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>Wholesale Price</label>
          <input
            type="number"
            step="0.01"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Wholesale Tax %</label>
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
          Save
        </button>

        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ItemForm;