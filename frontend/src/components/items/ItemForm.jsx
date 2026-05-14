
import { useEffect, useState } from "react";

function ItemForm({
  editingItem,
  onSave,
  onCancel,
}) {

  const [name, setName] =
    useState("");

  const [code, setCode] =
    useState("");

  const [retailPrice, setRetailPrice] =
    useState("");

  const [retailTaxRate, setRetailTaxRate] =
    useState("");

  /* =========================
     LOAD EDIT ITEM
  ========================= */

  useEffect(() => {

    if (editingItem) {

      setName(
        editingItem.name || ""
      );

      setCode(
        editingItem.code || ""
      );

      setRetailPrice(
        editingItem.retail_price || ""
      );

      setRetailTaxRate(
        editingItem.retail_tax_rate || ""
      );

    }

    else {

      setName("");

      setCode("");

      setRetailPrice("");

      setRetailTaxRate("");

    }

  }, [editingItem]);

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = () => {

    /* VALIDATION */

    if (
      name.trim() === "" ||
      code.trim() === "" ||
      retailPrice === "" ||
      retailTaxRate === ""
    ) {

      alert(
        "Please fill all fields"
      );

      return;

    }

    const itemData = {

      id: editingItem
        ? editingItem.id
        : Date.now(),

      name,

      code,

      retail_price:
        Number(retailPrice),

      retail_tax_rate:
        Number(retailTaxRate),

    };

    onSave(itemData);

  };

  return (

    <div>

      <h2 className="form-title">

        {editingItem
          ? "Edit Item"
          : "Add Item"}

      </h2>

      <div className="form-grid">

        {/* NAME */}

        <div className="form-group">

          <label>
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="Enter item name"
          />

        </div>

        {/* CODE */}

        <div className="form-group">

          <label>
            Code
          </label>

          <input
            type="text"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
              )
            }
            placeholder="Enter item code"
          />

        </div>

        {/* PRICE */}

        <div className="form-group">

          <label>
            Retail Price
          </label>

          <input
            type="number"
            value={retailPrice}
            onChange={(e) =>
              setRetailPrice(
                e.target.value
              )
            }
            placeholder="0.00"
          />

        </div>

        {/* TAX */}

        <div className="form-group">

          <label>
            Retail Tax %
          </label>

          <input
            type="number"
            value={retailTaxRate}
            onChange={(e) =>
              setRetailTaxRate(
                e.target.value
              )
            }
            placeholder="0"
          />

        </div>

      </div>

      {/* ACTIONS */}

      <div className="form-actions">

        <button
          className="save-btn"
          onClick={handleSubmit}
        >

          Save

        </button>

        <button
          className="cancel-btn"
          onClick={onCancel}
        >

          Cancel

        </button>

      </div>

    </div>

  );

}

export default ItemForm;

