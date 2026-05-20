import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const API_URL = "http://127.0.0.1:8000/api";

function SalesPage({ setPage }) {
    const [branches, setBranches] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [salesReps, setSalesReps] = useState([]);
    const [items, setItems] = useState([]);
    const [exchangeRates, setExchangeRates] = useState([]);
    const [branch, setBranch] = useState("");
    const [warehouse, setWarehouse] = useState("");
    const [customer, setCustomer] = useState("");
    const [salesRep, setSalesRep] = useState("");
    const [paymentType, setPaymentType] = useState("cash");
    const [exchangeRate, setExchangeRate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [showExchangeRateModal, setShowExchangeRateModal] =useState(false);
    const [newExchangeRate, setNewExchangeRate] =useState("");
    const [newExchangeRateDate, setNewExchangeRateDate] =useState(new Date().toISOString().split("T")[0]);
    const [invoiceItems, setInvoiceItems] = useState([
  {
    item: "",
    quantity: "",
    unit_price_usd: "",
    unit_price_syp: "",
  },
]);
const [showCustomerModal, setShowCustomerModal] = useState(false);
const [newCustomerName, setNewCustomerName] = useState("");
const [showItemModal, setShowItemModal] =useState(false);
const [newItemName, setNewItemName] =useState("");
const [newItemCode, setNewItemCode] =useState("");
const [newRetailPrice, setNewRetailPrice] =useState("");
const [newWholesalePrice, setNewWholesalePrice] =useState("");
useEffect(() => {
  if (!warehouse) {
    setItems([]);
    return;
  }


  apiFetch(
  `/warehouse-items/?warehouse=${warehouse}`
)
    .then((res) => res.json())
    .then((data) => {
      setItems(Array.isArray(data) ? data : []);
      setInvoiceItems([
        {
          item: "",
          quantity: "",
          unit_price_usd: "",
          unit_price_syp: "",
        },
      ]);
    })
    .catch((err) => console.error(err));
}, [warehouse]);
useEffect(() => {
  Promise.all([
  apiFetch("/branches/"),
  apiFetch("/customers/"),
  apiFetch("/exchange-rates/"),
  apiFetch("/sales-representatives/"),
])
    .then((responses) =>
      Promise.all(responses.map((res) => res.json()))
    )
    .then(([
      branchesData,
      customersData,
      ratesData,
      repsData,
    ]) => {
      setBranches(
        Array.isArray(branchesData)
          ? branchesData
          : branchesData?.results || []
      );

      setCustomers(
        Array.isArray(customersData)
          ? customersData
          : customersData?.results || []
      );

      const ratesList =
        Array.isArray(ratesData)
          ? ratesData
          : ratesData?.results || [];

      setExchangeRates(ratesList);

      if (ratesList.length > 0) {
        setExchangeRate(ratesList[0].id);
      }

      setSalesReps(
        Array.isArray(repsData)
          ? repsData
          : repsData?.results || []
      );
    })
    .catch((err) => {
      console.error(err);
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
    });
}, [branch]);
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

    const selectedItem = items.find(
      (item) => item.id === Number(value)
    );

    const selectedRate = exchangeRates.find(
      (rate) => rate.id === Number(exchangeRate)
    );

    const usdPrice =
      selectedItem?.retail_price || 0;

    const rateValue =
      selectedRate?.usd_to_syp || 0;

    updatedItems[index].unit_price_usd =
      usdPrice;

    updatedItems[index].unit_price_syp =
      (usdPrice * rateValue).toFixed(2);
  }

  if (
    field === "quantity" ||
    field === "unit_price_usd"
  ) {

    const selectedRate = exchangeRates.find(
      (rate) => rate.id === Number(exchangeRate)
    );

    const rateValue =
      selectedRate?.usd_to_syp || 0;

    updatedItems[index].unit_price_syp =
      (
        Number(updatedItems[index].unit_price_usd || 0) *
        rateValue
      ).toFixed(2);
  }
if (field === "quantity") {

  const selectedItem = items.find(
    (item) =>
      item.id === Number(updatedItems[index].item)
  );

  const available =
    Number(selectedItem?.available_quantity || 0);

  if (Number(value) > available) {

    alert(
      `Only ${available} available in stock`
    );

    updatedItems[index].quantity = available;

    setInvoiceItems([...updatedItems]);

    return;
  }
}
  setInvoiceItems(updatedItems);
};

const addRow = () => {
  setInvoiceItems([
    ...invoiceItems,
    {
      item: "",
      quantity: "",
      unit_price_usd: "",
      unit_price_syp: "",
    },
  ]);
};

const removeRow = (index) => {
  setInvoiceItems(
    invoiceItems.filter((_, i) => i !== index)
  );
};
const totalUsd = invoiceItems.reduce(
  (total, row) =>
    total +
    (
      Number(row.quantity || 0) *
      Number(row.unit_price_usd || 0)
    ),
  0
);

const totalSyp = invoiceItems.reduce(
  (total, row) =>
    total +
    (
      Number(row.quantity || 0) *
      Number(row.unit_price_syp || 0)
    ),
  0
);
const handleCreateInvoice = async () => {

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
    customer: Number(customer),

    sales_rep: salesRep
      ? Number(salesRep)
      : null,

    invoice_date: new Date().toISOString(),

    payment_type: paymentType,

    due_date:
      paymentType === "credit"
        ? dueDate || null
        : null,

    status:
      paymentType === "cash"
        ? "paid"
        : "unpaid",

    exchange_rate: exchangeRate
      ? Number(exchangeRate)
      : null,

    items: invoiceItems.map((row) => ({
      item: Number(row.item),
      quantity: Number(row.quantity),
      unit_price_usd: Number(row.unit_price_usd),
      unit_price_syp: Number(row.unit_price_syp),
    })),
  };

  try {

    const response = await fetch(
      `${API_URL}/sales-invoices/`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();

    console.log(errorData);

    alert(JSON.stringify(errorData));

    return;
    }

    alert("Sales invoice created");

    setPage("sales-invoices");

  } catch (error) {

    console.error(error);

    alert("Error creating invoice");
  }
};
const handleAddCustomer = async () => {

  

  try {

   const response = await apiFetch(
  "/customers/",
  {
    method: "POST",

    body: JSON.stringify({
      name: newCustomerName,
    }),
  }
);

    const data =
      await response.json();

    setCustomers((prev) => [
      {
        id: data.id,

        name:
          data.name ||
          newCustomerName,
      },

      ...prev,
    ]);

    setCustomer(data.id);

    setNewCustomerName("");

    setShowCustomerModal(false);

  } catch {

    alert(
      "Error adding customer"
    );
  }
};
const handleAddItem = async () => {

  

  try {

    const response = await apiFetch(
  "/items/",
  {
    method: "POST",

    body: JSON.stringify({

      name:
        newItemName,

      code:
        newItemCode,

      retail_price:
        Number(
          newRetailPrice
        ),

      wholesale_price:
        Number(
          newWholesalePrice
        ),

      retail_tax_rate: 0,

      wholesale_tax_rate: 0,

    }),
  }
);

    const data =
      await response.json();

    setItems((prev) => [
      data,
      ...prev,
    ]);

    setNewItemName("");

    setNewItemCode("");

    setNewRetailPrice("");

    setNewWholesalePrice("");

    setShowItemModal(false);

  } catch {

    alert(
      "Error adding item"
    );
  }
};
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Sales Invoice</h1>
          <p className="page-subtitle">Create a new sales invoice</p>
        </div>

        <button
          className="secondary-btn"
          onClick={() => setPage("sales-invoices")}
        >
          Back
        </button>
      </div>

      <div className="card">
       <div className="form-grid">

  <div className="form-group">
    <label>Branch</label>

    <select
      value={branch}
      onChange={(e) => setBranch(e.target.value)}
    >
      <option value="">
        Select Branch
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
<div className="form-group">
  <label>Warehouse</label>

  <select
    value={warehouse}
    onChange={(e) => setWarehouse(e.target.value)}
  >
    <option value="">
      Select Warehouse
    </option>

    {warehouses.map((warehouse) => (
      <option
        key={warehouse.id}
        value={warehouse.id}
      >
        {warehouse.name}
      </option>
    ))}
  </select>
</div>
  <div className="form-group">
    <label>Payment Type</label>

    <select
      value={paymentType}
      onChange={(e) =>
        setPaymentType(e.target.value)
      }
    >
      <option value="cash">
        Cash
      </option>

      <option value="credit">
        Credit
      </option>
    </select>
    {paymentType === "credit" && (
  <div className="form-group">
    <label>Due Date</label>

    <input
      type="date"
      value={dueDate}
      onChange={(e) =>
        setDueDate(e.target.value)
      }
    />
  </div>
)}
  </div>

  <div className="form-group">
    <label>Sales Representative</label>

    <select
      value={salesRep}
      onChange={(e) => setSalesRep(e.target.value)}
    >
      <option value="">
        Select Sales Rep
      </option>

      {salesReps.map((rep) => (
        <option
          key={rep.id}
          value={rep.id}
        >
          {rep.name}
        </option>
      ))}
    </select>
  </div>
<div className="form-group">
    <label>Customer</label>

    <div className="exchange-rate-row">

<select
  value={customer}
  onChange={(e)=>
    setCustomer(e.target.value)
  }
>
  <option value="">
    Select Customer
  </option>

  {customers.map((customer)=>(
    <option
      key={customer.id}
      value={customer.id}
    >
      {customer.name}
    </option>
  ))}

</select>

<button
  type="button"
  className="add-rate-btn"
  onClick={() =>
    setShowCustomerModal(true)
  }
>
+
</button>

</div>
  </div>
  
<div className="form-group">
  <label>Exchange Rate</label>

  <div className="exchange-rate-row">

    <select
      value={exchangeRate}
      onChange={(e) =>
        setExchangeRate(e.target.value)
      }
    >
      <option value="">
        Select Exchange Rate
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
<div>
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

      </div>
      <div className="card table-wrapper">

  <table>

    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Unit USD</th>
        <th>Unit SYP</th>
        <th>Total USD</th>
        <th>Total SYP</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>

      {invoiceItems.map((row, index) => (

        <tr key={index}>

          <td>

<div className="exchange-rate-row">

<select
 value={row.item}
 onChange={(e)=>
   handleItemChange(
    index,
    "item",
    e.target.value
   )
 }
>

<option value="">
 Select Item
</option>

{items.map((item)=>(
<option
 key={item.id}
 value={item.id}
>
{item.name}
({item.available_quantity})
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
                handleItemChange(
                  index,
                  "quantity",
                  e.target.value
                )
              }
            />
          </td>

          <td>
            <input
              type="number"
              value={row.unit_price_usd}
              onChange={(e) =>
                handleItemChange(
                  index,
                  "unit_price_usd",
                  e.target.value
                )
              }
            />
          </td>

          <td>
            <input
              type="number"
              value={row.unit_price_syp}
              readOnly
            />
          </td>
<td>
  {(
    Number(row.quantity || 0) *
    Number(row.unit_price_usd || 0)
  ).toFixed(2)}
</td>

<td>
  {(
    Number(row.quantity || 0) *
    Number(row.unit_price_syp || 0)
  ).toFixed(2)}
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

  <button
    className="add-btn"
    onClick={addRow}
  >
    Add Item
  </button>

</div>
<div>
  <div className="card table-wrapper">

    <div>
      <span>Total USD</span>

      <strong>
        ${totalUsd.toFixed(2)}
      </strong>
    </div>

    <br />

    <div>
      <span>Total SYP</span>

      <strong>
        {totalSyp.toFixed(2)} SYP
      </strong>
    </div>

  </div>

  <button
    className="add-btn"
    onClick={handleCreateInvoice}
  >
    Create Sales Invoice
  </button>

</div>
{showExchangeRateModal && (

  <div className="modal-overlay">

    <div className="modal-content">

      <h3>Add Exchange Rate</h3>
      <input
        type="date"
        value={newExchangeRateDate}
        onChange={(e) =>
          setNewExchangeRateDate(e.target.value)
        }
      />
      <input
        type="number"
        placeholder="USD to SYP"
        value={newExchangeRate}
        onChange={(e) =>
          setNewExchangeRate(e.target.value)
        }
      />

      <div className="modal-actions">

  <button
    className="modal-btn secondary"
    onClick={() => setShowExchangeRateModal(false)}
  >
    Cancel
  </button>

  <button
    className="modal-btn primary"
    onClick={handleAddExchangeRate}
  >
    Save
  </button>

</div>

    </div>

  </div>
)}
{showCustomerModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Add Customer</h3>

      <input
        type="text"
        placeholder="Customer name"
        value={newCustomerName}
        onChange={(e) => setNewCustomerName(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="modal-btn secondary"
          onClick={() => setShowCustomerModal(false)}
        >
          Cancel
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddCustomer}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
{showItemModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Add Item</h3>

      <input
        type="text"
        placeholder="Item name"
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Code"
        value={newItemCode}
        onChange={(e) => setNewItemCode(e.target.value)}
      />

      <input
        type="number"
        placeholder="Retail price USD"
        value={newRetailPrice}
        onChange={(e) => setNewRetailPrice(e.target.value)}
      />

      <input
        type="number"
        placeholder="Wholesale price USD"
        value={newWholesalePrice}
        onChange={(e) => setNewWholesalePrice(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="modal-btn secondary"
          onClick={() => setShowItemModal(false)}
        >
          Cancel
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddItem}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
    </>
    
  );
}

export default SalesPage;