import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

const API_URL = "http://127.0.0.1:8000/api";

function SalesPage({ setPage }) {
    const { t } = useTranslation();

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
      alert(t("item_already_added"));
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

    const usdPrice = selectedItem?.retail_price || 0;
    const rateValue = selectedRate?.usd_to_syp || 0;

    updatedItems[index].unit_price_usd = usdPrice;
    updatedItems[index].unit_price_syp = (usdPrice * rateValue).toFixed(2);
  }

  if (
    field === "quantity" ||
    field === "unit_price_usd"
  ) {
    const selectedRate = exchangeRates.find(
      (rate) => rate.id === Number(exchangeRate)
    );

    const rateValue = selectedRate?.usd_to_syp || 0;

    updatedItems[index].unit_price_syp = (
      Number(updatedItems[index].unit_price_usd || 0) * rateValue
    ).toFixed(2);
  }

  if (field === "quantity") {
    const selectedItem = items.find(
      (item) =>
        item.id === Number(updatedItems[index].item)
    );

    const available = Number(selectedItem?.available_quantity || 0);

    if (
      selectedItem?.item_type !== "service" &&
      Number(value) > available
    ) {
      alert(`${t("only_available_in_stock")} ${available}`);
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
  if (!branch) {
  alert(t("please_select_branch"));
  return;
}

if (!warehouse) {
  alert(t("please_select_warehouse"));
  return;
}

if (!customer) {
  alert(t("please_select_customer"));
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
    Number(row.unit_price_usd) <= 0
);

if (invalidRow) {
  alert(t("please_complete_invoice_items"));
  return;
}
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

    alert(t("sales_invoice_created"));

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
return(
  <>
  <div className="page-header">
    <div>
      <h1 className="page-title">
        {t("create_sales_invoice")}
      </h1>

      <p className="page-subtitle">
        {t("create_new_sales_invoice")}
      </p>
    </div>

    <button
      className="secondary-btn"
      onClick={() => setPage("sales-invoices")}
    >
      {t("back")}
    </button>
  </div>

  <div className="card">
    <div className="form-grid">

      <div className="form-group">
        <label>{t("branch")}</label>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="">
            {t("select_branch")}
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
        <label>{t("warehouse")}</label>

        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
        >
          <option value="">
            {t("select_warehouse")}
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
        <label>{t("payment_type")}</label>

        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="cash">
            {t("cash")}
          </option>

          <option value="credit">
            {t("credit")}
          </option>
        </select>

        {paymentType === "credit" && (
          <div className="form-group">
            <label>{t("due_date")}</label>

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
        <label>{t("sales_representative")}</label>

        <select
          value={salesRep}
          onChange={(e) => setSalesRep(e.target.value)}
        >
          <option value="">
            {t("select_sales_representative")}
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
        <label>{t("customer")}</label>

        <div className="exchange-rate-row">
          <select
            value={customer}
            onChange={(e) =>
              setCustomer(e.target.value)
            }
          >
            <option value="">
              {t("select_customer")}
            </option>

            {customers.map((customer) => (
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
          <th>{t("unit_usd")}</th>
          <th>{t("unit_syp")}</th>
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
<input
  type="text"
  placeholder={t("scan_barcode")}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      const scannedId = Number(e.target.value);

      const scannedItem = items.find(
        (item) => item.id === scannedId
      );

      if (!scannedItem) {
        alert(t("item_not_found"));
        e.target.value = "";
        return;
      }

      handleItemChange(
        index,
        "item",
        String(scannedItem.id)
      );

      handleItemChange(
        index,
        "quantity",
        "1"
      );

      e.target.value = "";
    }
  }}
  style={{
    maxWidth: "160px",
  }}
/>
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
                ✕
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
      {t("add_item")}
    </button>
  </div>
<div>
  <div className="card table-wrapper">

    <div>
      <span>{t("total_usd")}</span>

      <strong>
        ${totalUsd.toFixed(2)}
      </strong>
    </div>

    <br />

    <div>
      <span>{t("total_syp")}</span>

      <strong>
        {totalSyp.toFixed(2)} SYP
      </strong>
    </div>

  </div>

  <button
    className="add-btn"
    onClick={handleCreateInvoice}
  >
    {t("create_sales_invoice")}
  </button>

</div>

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

{showCustomerModal && (
  <div className="modal-overlay">
    <div className="modal-content">

      <h3>{t("add_customer")}</h3>

      <input
        type="text"
        placeholder={t("customer_name")}
        value={newCustomerName}
        onChange={(e) =>
          setNewCustomerName(e.target.value)
        }
      />

      <div className="modal-actions">

        <button
          className="modal-btn secondary"
          onClick={() =>
            setShowCustomerModal(false)
          }
        >
          {t("cancel")}
        </button>

        <button
          className="modal-btn primary"
          onClick={handleAddCustomer}
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
        onChange={(e) =>
          setNewItemName(e.target.value)
        }
      />

      <input
        type="text"
        placeholder={t("code")}
        value={newItemCode}
        onChange={(e) =>
          setNewItemCode(e.target.value)
        }
      />

      <input
        type="number"
        placeholder={t("retail_price_usd")}
        value={newRetailPrice}
        onChange={(e) =>
          setNewRetailPrice(e.target.value)
        }
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
          onClick={() =>
            setShowItemModal(false)
          }
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

</>
);
}

export default SalesPage;