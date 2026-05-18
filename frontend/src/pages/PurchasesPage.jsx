import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = "http://127.0.0.1:8000/api";

function PurchasesPage({ setPage }) {
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

  const [invoiceItems, setInvoiceItems] = useState([
    {
      item: "",
      quantity: "",
      unit_cost_usd: "",
      unit_cost_syp: "",
    },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    Promise.all([
      fetch(`${API_URL}/branches/`, { headers }).then((res) => res.json()),
      fetch(`${API_URL}/suppliers/`, { headers }).then((res) => res.json()),
      fetch(`${API_URL}/items/`, { headers }).then((res) => res.json()),
      fetch(`${API_URL}/exchange-rates/`, { headers }).then((res) => res.json()),
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

    const token = localStorage.getItem("access_token");

    fetch(`${API_URL}/warehouses/by-branch/?branch=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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
  }
    const updatedItems = [...invoiceItems];

    updatedItems[index][field] = value;

    if (field === "item") {
      const selectedItem = items.find((item) => String(item.id) === String(value));
      updatedItems[index].unit_cost_usd = selectedItem?.retail_price || "";
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
    const token = localStorage.getItem("access_token");
    if (
      paymentType === "credit" &&
      !dueDate
    ) {
      alert("Due date is required");

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
    fetch(`${API_URL}/purchase-invoices/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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
  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Create purchase invoices</p>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="form-group">
            <label>Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Warehouse</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Supplier</label>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Payment Type</label>
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
            </select>
          </div>

          {paymentType === "credit" && (
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label>Exchange Rate</label>
            <select value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)}>
              <option value="">No Exchange Rate</option>
              {exchangeRates.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.usd_to_syp}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Cost USD</th>
              <th>Unit Cost SYP</th>
              <th>Total USD</th>
              <th>Total SYP</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
  {invoiceItems.map((row, index) => (
    <tr key={index}>
      <td>
        <select
          value={row.item}
          onChange={(e) =>
            handleItemChange(index, "item", e.target.value)
          }
        >
          <option value="">Select Item</option>

          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
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
          Add Item
        </button>
</div>
<div>
    <div className="card table-wrapper">
  <div>
    <span>Total USD</span>
    <strong>
      ${invoiceTotalUsd.toFixed(2)}
    </strong>
  </div>
<br></br>
  <div>
    <span>Total SYP</span>
    <strong>
      {invoiceTotalSyp.toFixed(2)} SYP
    </strong>
  </div>
</div>
</div>
        <button className="add-btn" onClick={handleCreateInvoice}>
          Create Purchase Invoice
        </button>
      
    </div>
  );
}

export default PurchasesPage;