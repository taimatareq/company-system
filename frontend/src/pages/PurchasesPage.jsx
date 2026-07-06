import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

const API_URL = "http://127.0.0.1:8000/api";

function PurchasesPage({ setPage }) {
  const { t } = useTranslation();

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [branch, setBranch] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [supplier, setSupplier] = useState("");
  const [paymentType, setPaymentType] = useState("cash");
  const [dueDate, setDueDate] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [showExchangeRateModal, setShowExchangeRateModal] =useState(false);
  const [newExchangeRate, setNewExchangeRate] =useState("");
  const [newExchangeRateDate, setNewExchangeRateDate] =useState(new Date().toISOString().split("T")[0]);
  const [invoiceItems, setInvoiceItems] = useState([{item: "",quantity: "",unit_cost_usd: "",unit_cost_syp: "",},]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCode, setNewItemCode] = useState("");
  const [newRetailPrice, setNewRetailPrice] = useState("");
  const [newWholesalePrice, setNewWholesalePrice] =
  useState("");
  useEffect(() => {

    // const headers = {
    //   Authorization: `Bearer ${token}`,
    //   "Content-Type": "application/json",
    // };

    Promise.all([
     apiFetch("/branches/")
    .then((res) => res.json()),

    apiFetch("/suppliers/")
    .then((res) => res.json()),

    apiFetch("/items/")
    .then((res) => res.json()),

    apiFetch("/exchange-rates/")
    .then((res) => res.json()),
        ])
      .then(([branchesData, suppliersData, itemsData, ratesData]) => {
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.results || []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData.results || []);
        setItems(Array.isArray(itemsData) ? itemsData : itemsData.results || []);
        const ratesList =
            Array.isArray(ratesData)
              ? ratesData
              : ratesData.results || [];

          setExchangeRates(ratesList);

          if (ratesList.length > 0) {
            setExchangeRate(ratesList[0].id);
          }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load purchase data");
      });
  }, []);

  useEffect(() => {
    if (!branch) {
      setWarehouses([]);
      setWarehouse("");
      return;
    }


    apiFetch(
  `/warehouses/by-branch/?branch=${branch}`
)
      .then((res) => res.json())
      .then((data) => {
        setWarehouses(Array.isArray(data) ? data : []);
        setWarehouse("");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load warehouses");
      });
  }, [branch]);

  const handleItemChange = (index, field, value) => {
  const updatedItems = [...invoiceItems];

  updatedItems[index][field] = value;

  if (field === "item") {
    const itemAlreadyExists = invoiceItems.some(
      (row, i) =>
        i !== index &&
        row.item === value
    );

    if (itemAlreadyExists) {
      alert("Item already added");
      return;
    }


    apiFetch(
  `/items/${value}/last-purchase-price/`
)
      .then((res) => res.json())
      .then((data) => {
        updatedItems[index].unit_cost_usd =
          data.unit_cost_usd || 0;

        updatedItems[index].unit_cost_syp =
          data.unit_cost_syp || 0;

        setInvoiceItems([...updatedItems]);
      });

    return;
  }

  setInvoiceItems(updatedItems);
};

    

  const addRow = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        item: "",
        quantity: "",
        unit_cost_usd: "",
        unit_cost_syp: "",
      },
    ]);
  };

  const removeRow = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = () => {
    if (!branch) {
  alert(t("please_select_branch"));
  return;
}

if (!warehouse) {
  alert(t("please_select_warehouse"));
  return;
}

if (!supplier) {
  alert(t("please_select_supplier"));
  return;
}

if (!exchangeRate) {
  alert(t("please_select_exchange_rate"));
  return;
}

if (paymentType === "credit" && !dueDate) {
  alert(t("please_select_due_date"));
  return;
}

if (invoiceItems.length === 0) {
  alert(t("please_add_at_least_one_item"));
  return;
}

const invalidRow = invoiceItems.find(
  (row) =>
    !row.item ||
    Number(row.quantity) <= 0 ||
    Number(row.unit_cost_usd) <= 0
);

if (invalidRow) {
  alert(t("please_complete_invoice_items"));
  return;
}
    if (
      paymentType === "credit" &&
      !dueDate
    ) {
      alert("Due date is required");

      return;
    }
    if (
  invoiceItems.length === 0 ||
  invoiceItems.some(
    (row) =>
      !row.item ||
      Number(row.quantity) <= 0 ||
      Number(row.unit_cost_usd) <= 0
  )
) {
  alert("Please add at least one valid item");
  return;
}
    const payload = {
    branch: Number(branch),
    warehouse: Number(warehouse),
    supplier: Number(supplier),
    invoice_date: new Date().toISOString(),
    payment_type: paymentType,
    due_date: paymentType === "credit" ? dueDate || null : null,
    status: 
        paymentType ==="cash"
        ? "paid"
        :"unpaid",
    exchange_rate: exchangeRate ? Number(exchangeRate) : null,

    items: invoiceItems.map((row) => {
        const calculated = calculateRow(row);

        return {
        item: Number(row.item),
        quantity: Number(row.quantity),
        unit_cost_usd: Number(row.unit_cost_usd),
        unit_cost_syp: Number(calculated.unitSyp),
        };
    }),
    };
    console.log("PURCHASE PAYLOAD:", payload);
    apiFetch("/purchase-invoices/", {
  method: "POST",

  body: JSON.stringify(payload),
})
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          console.log(data);
          toast.error("Failed to create purchase invoice");
          return;
        }

        toast.success("Purchase invoice created successfully");
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error creating purchase invoice");
      });
  };
// const selectedExchangeRate = exchangeRates.find(
//   (rate) => String(rate.id) === String(exchangeRate)
// );

// const usdToSyp = Number(
//   selectedExchangeRate?.usd_to_syp || 0
// );
const selectedExchangeRate =
  exchangeRates.find(
    (rate) => String(rate.id) === String(exchangeRate)
  ) || exchangeRates[0];

const usdToSyp = Number(
  selectedExchangeRate?.usd_to_syp || 0
);
const calculateRow = (row) => {
  const quantity = Number(row.quantity || 0);
  const unitUsd = Number(row.unit_cost_usd || 0);

  const unitSyp = usdToSyp
    ? unitUsd * usdToSyp
    : Number(row.unit_cost_syp || 0);

  return {
    unitSyp,
    totalUsd: quantity * unitUsd,
    totalSyp: quantity * unitSyp,
  };
};

const invoiceTotalUsd = invoiceItems.reduce(
  (total, row) => total + calculateRow(row).totalUsd,
  0
);

const invoiceTotalSyp = invoiceItems.reduce(
  (total, row) => total + calculateRow(row).totalSyp,
  0
);
const handleAddExchangeRate = async () => {


  try {

   const response = await apiFetch(
  "/exchange-rates/",
  {
    method: "POST",

    body: JSON.stringify({
      rate_date: newExchangeRateDate,

      usd_to_syp:
        Number(newExchangeRate),
    }),
  }
);

    const data = await response.json();

    setExchangeRates([
      data,
      ...exchangeRates,
    ]);

    setExchangeRate(data.id);

    setNewExchangeRate("");

    setShowExchangeRateModal(false);

  } catch (error) {

    console.error(error);

    alert("Error adding exchange rate");
  }
};
const handleAddSupplier = async () => {

const response = await apiFetch(
  "/suppliers/",
  {
    method: "POST",

    body: JSON.stringify({
      name: newSupplierName,
    }),
  }
);
  const data = await response.json();

setSuppliers((prev) => [
  {
    id: data.id,
    name: data.name,
  },
  ...prev,
]);  setSupplier(data.id);
  setNewSupplierName("");
  setShowSupplierModal(false);
};
const handleAddItem = async () => {


  try {

    const response = await apiFetch(
  "/items/",
  {
    method: "POST",

    body: JSON.stringify({
      name: newItemName,

      code: newItemCode,

      retail_price:
        Number(newRetailPrice),

      wholesale_price:
        Number(newWholesalePrice),

      retail_tax_rate: 0,

      wholesale_tax_rate: 0,
    }),
  }
);

    const data = await response.json();

    setItems((prev) => [
      data,
      ...prev,
    ]);

    setNewItemName("");
    setNewItemCode("");
    setNewRetailPrice("");

    setShowItemModal(false);

  } catch (error) {

    console.error(error);

    alert("Error adding item");
  }
};
  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("purchases")}</h1>
          <p className="page-subtitle">{t("create_purchase_invoices")}</p>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>{t("branch")}</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">{t("select_branch")}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t("warehouse")}</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="">{t("select_warehouse")}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
  <label>{t("supplier")}</label>

  <div className="exchange-rate-row">
    <select
      value={supplier}
      onChange={(e) => setSupplier(e.target.value)}
    >
      <option value="">{t("select_supplier")}</option>

      {suppliers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="add-rate-btn"
      onClick={() => setShowSupplierModal(true)}
    >
      +
    </button>
  </div>
</div>

          <div className="form-group">
            <label>{t("payment_type")}</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="cash">{t("cash")}</option>
              <option value="credit">{t("credit")}</option>
            </select>
          </div>

          {paymentType === "credit" && (
            <div className="form-group">
              <label>{t("due_date")}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

         <div className="form-group">
  <label>{t("exchange_rate")}</label>

  <div className="exchange-rate-row">

    <select
      value={exchangeRate}
      onChange={(e) =>
        setExchangeRate(e.target.value)
      }
    >
      <option value="">
        {t("select_exchange_rate")}
      </option>

      {exchangeRates.map((rate) => (
        <option
          key={rate.id}
          value={rate.id}
        >
          {rate.usd_to_syp}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="add-rate-btn"
      onClick={() =>
        setShowExchangeRateModal(true)
      }
    >
      +
    </button>

  </div>
</div>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("item")}</th>
              <th>{t("quantity")}</th>
              <th>{t("unit_cost_usd")}</th>
              <th>{t("unit_cost_syp")}</th>
              <th>{t("total_usd")}</th>
              <th>{t("total_syp")}</th>
              <th>{t("action")}</th>
            </tr>
          </thead>

          <tbody>
  {invoiceItems.map((row, index) => (
    <tr key={index}>
      <td>
  <div className="exchange-rate-row">

    <select
      value={row.item}
      onChange={(e) =>
        handleItemChange(
          index,
          "item",
          e.target.value
        )
      }
    >
      <option value="">
        {t("select_item")}
      </option>

      {items.map((item) => (
        <option
          key={item.id}
          value={item.id}
        >
          {item.name}
        </option>
      ))}
    </select>

    <button
      type="button"
      className="add-rate-btn"
      onClick={() =>
        setShowItemModal(true)
      }
    >
      +
    </button>

  </div>
</td>

      <td>
        <input
          type="number"
          value={row.quantity}
          onChange={(e) =>
            handleItemChange(index, "quantity", e.target.value)
          }
        />
      </td>

      <td>
        <input
          type="number"
          value={row.unit_cost_usd}
          onChange={(e) =>
            handleItemChange(
              index,
              "unit_cost_usd",
              e.target.value
            )
          }
        />
      </td>

      <td>
        <input
          type="number"
          value={calculateRow(row).unitSyp.toFixed(2)}
          readOnly
        />
      </td>

      <td>
        {calculateRow(row).totalUsd.toFixed(2)}
      </td>

      <td>
        {calculateRow(row).totalSyp.toFixed(2)}
      </td>

      <td>
        <button
          className="delete-btn"
          onClick={() => removeRow(index)}
        >
          X
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>

        <button className="add-btn" onClick={addRow}>
          {t("add_item")}
        </button>
</div>
<div>
    <div className="card table-wrapper">
  <div>
    <span>{t("total_usd")}</span>
    <strong>
      ${invoiceTotalUsd.toFixed(2)}
    </strong>
  </div>
<br></br>
  <div>
    <span>{t("total_syp")}</span>
    <strong>
      {invoiceTotalSyp.toFixed(2)} SYP
    </strong>
  </div>
</div>
</div>
        <button className="add-btn" onClick={handleCreateInvoice}>
          {t("create_purchase_invoice")}
        </button>
      {showExchangeRateModal && (

  <div className="modal-overlay">

    <div className="modal-content">

      <h3>{t("add_exchange_rate")}</h3>

      <input
        type="date"
        value={newExchangeRateDate}
        onChange={(e) =>
          setNewExchangeRateDate(e.target.value)
        }
      />

      <input
        type="number"
        placeholder={t("usd_to_syp")}
        value={newExchangeRate}
        onChange={(e) =>
          setNewExchangeRate(e.target.value)
        }
      />

      <div className="modal-actions">

        <button
          className="modal-btn secondary"
          onClick={() =>
            setShowExchangeRateModal(false)
          }
        >
          {t("cancel")}
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddExchangeRate}
        >
          {t("save")}
        </button>

      </div>

    </div>

  </div>
)}
{showSupplierModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>{t("add_supplier")}</h3>

      <input
        type="text"
        placeholder={t("supplier_name")}
        value={newSupplierName}
        onChange={(e) => setNewSupplierName(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="modal-btn secondary"
          onClick={() => setShowSupplierModal(false)}
        >
          {t("cancel")}
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddSupplier}
        >
          {t("save")}
        </button>
      </div>
    </div>
  </div>
)}
{showItemModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>{t("add_item")}</h3>

      <input
        type="text"
        placeholder={t("item_name")}
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
      />

      <input
        type="text"
        placeholder={t("code")}
        value={newItemCode}
        onChange={(e) => setNewItemCode(e.target.value)}
      />

      <input
  type="number"
  placeholder={t("retail_price_usd")}
  value={newRetailPrice}
  onChange={(e) => setNewRetailPrice(e.target.value)}
/>

<input
  type="number"
  placeholder={t("wholesale_price_usd")}
  value={newWholesalePrice}
  onChange={(e) =>
    setNewWholesalePrice(e.target.value)
  }
/>

      <div className="modal-actions">
        <button
          className="modal-btn secondary"
          onClick={() => setShowItemModal(false)}
        >
          {t("cancel")}
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddItem}
        >
          {t("save")}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
    
  );
}

export default PurchasesPage;