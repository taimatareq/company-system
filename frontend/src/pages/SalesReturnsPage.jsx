
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import AlertModal from "../components/common/AlertModal";
import ConfirmModal from "../components/common/ConfirmModal";
function SalesReturnsPage() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    id: null,
  });
  const tr = (arabic, english) => (ar ? arabic : english);

  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const request = async (url, options) => {
    const response = await apiFetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.detail === "string"
          ? data.detail
          : JSON.stringify(data)
      );
    }

    return data;
  };

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/sales-returns/");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      setReturns(
        Array.isArray(data) ? data : data.results || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
  if (error) {
    setAlertMessage(error);
  }
}, [error]);

useEffect(() => {
  if (notice) {
    setAlertMessage(notice);
  }
}, [notice]);
  useEffect(() => {
  if (error) {
    setAlertMessage(error);
  }
}, [error]);
  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const startCreating = async () => {
    setError("");
    setNotice("");
    setEditingId(null);

    try {
      const data = await request("/sales-invoices/");

      setInvoices(
        Array.isArray(data) ? data : data.results || []
      );

      setInvoice(null);
      setInvoiceId("");
      setQuantities({});
      setReason("");
      setCreating(true);
    } catch (err) {
      setError(err.message);
    }
  };
  const startEditing = async (item) => {
    if (item.status !== "draft") return;

    setError("");
    setNotice("");

    try {
      const [returnData, invoiceData] = await Promise.all([
        request(`/sales-returns/${item.id}/`),
        request(`/sales-invoices/${item.invoice}/`),
      ]);

      if (returnData.status !== "draft") {
        setError(
          tr(
            "لا يمكن تعديل مرتجع تم تأكيده.",
            "Confirmed returns cannot be edited."
          )
        );
        return;
      }

      const existingQuantities = {};

      (returnData.items || []).forEach((returnItem) => {
        const invoiceItemId =
          typeof returnItem.invoice_item === "object"
            ? returnItem.invoice_item.id
            : returnItem.invoice_item;

        existingQuantities[invoiceItemId] =
          returnItem.quantity;
      });

      setEditingId(item.id);

      setInvoices([invoiceData]); // أضيفي هذا السطر
      setInvoice(invoiceData);
      setInvoiceId(String(invoiceData.id));

      setQuantities(existingQuantities);
      setReason(returnData.reason || "");

      setCreating(true);
    } catch (err) {
      setError(err.message);
    }
  };
  const selectInvoice = async (id) => {
    setInvoiceId(id);
    setInvoice(null);
    setQuantities({});
    setError("");

    if (!id) return;

    try {
      const data = await request(`/sales-invoices/${id}/`);
      setInvoice(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveReturn = async () => {
    setError("");
    setNotice("");

    if (!invoice || !invoiceId) {
      setError(
        tr("اختاري فاتورة أولًا.", "Select an invoice first.")
      );
      return;
    }

    const selectedItems = (invoice.items || []).filter(
      (item) => Number(quantities[item.id]) > 0
    );

    if (selectedItems.length === 0) {
      setError(
        tr(
          "حددي كمية مادة واحدة على الأقل.",
          "Enter a return quantity for at least one item."
        )
      );
      return;
    }

    const invalidQuantity = selectedItems.some(
      (item) =>
        !Number.isFinite(Number(quantities[item.id])) ||
        Number(quantities[item.id]) >
          Number(item.available_return_quantity ?? 0)
    );

    if (invalidQuantity) {
      setError(
        tr(
  "كمية الإرجاع لا يمكن أن تتجاوز الكمية المتاحة بعد المرتجعات المؤكدة.",
  "Return quantity cannot exceed the available quantity after confirmed returns."
)
      );
      return;
    }

    const items = selectedItems.map((item) => ({
      invoice_item: item.id,
      quantity: Number(quantities[item.id]),
    }));

    const isEditing = editingId !== null;

    setSaving(true);

    try {
      await request(
        isEditing
          ? `/sales-returns/${editingId}/`
          : "/sales-returns/",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isEditing
              ? {
                  reason,
                  items,
                }
              : {
                  invoice: Number(invoiceId),
                  reason,
                  items,
                }
          ),
        }
      );

      setCreating(false);
      setEditingId(null);

      setNotice(
        isEditing
          ? tr(
              "تم حفظ تعديلات المرتجع بنجاح.",
              "Return updated successfully."
            )
          : tr(
              "تم إنشاء المرتجع كمسودة بنجاح.",
              "Return draft created successfully."
            )
      );

      await loadReturns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
};
  const deleteReturn = async (id) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await apiFetch(`/sales-returns/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : JSON.stringify(data)
        );
      }

      setNotice(
        tr(
          "تم حذف مسودة المرتجع بنجاح.",
          "Return draft deleted successfully."
        )
      );

      await loadReturns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const confirmReturn = async (id) => {

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await request(`/sales-returns/${id}/confirm/`, {
        method: "POST",
      });

      setNotice(
        tr(
          "تم تأكيد المرتجع وتحديث المخزون.",
          "Return confirmed and inventory updated."
        )
      );

      await loadReturns();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      String(item.id).includes(search) ||
      String(item.invoice).includes(search) ||
      (item.reason || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      filter === "all" || item.status === filter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(
      ar ? "ar-SY" : "en-US"
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {tr("مرتجعات المبيعات", "Sales Returns")}
          </h1>

          <p className="page-subtitle">
            {tr(
              "إدارة المرتجعات المرتبطة بفواتير المبيعات",
              "Manage returns associated with sales invoices"
            )}
          </p>
        </div>

        <button
          className="add-btn"
          onClick={startCreating}
          disabled={saving}
        >
          {tr("+ إضافة مرتجع", "+ New Return")}
        </button>
      </div>

      

       {creating && (
  <div
    className="modal-overlay"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget && !saving) {
        setCreating(false);
      }
    }}
  >
    <div
      className="sales-return-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sales-return-modal-title"
    >
      <div className="sales-return-modal-header">
        <h3 id="sales-return-modal-title">
  {editingId !== null
    ? tr("تعديل مرتجع مبيعات", "Edit Sales Return")
    : tr("إضافة مرتجع مبيعات", "Create Sales Return")}
</h3>

        <button
          type="button"
          className="sales-return-modal-close"
          aria-label={tr("إغلاق", "Close")}
          onClick={() => setCreating(false)}
          disabled={saving}
        >
          ×
        </button>
      </div>

          <div>
            <label htmlFor="sales-return-invoice">
              {tr("فاتورة المبيعات", "Sales Invoice")}
            </label>

           <select
  id="sales-return-invoice"
  value={invoiceId}
  onChange={(e) => selectInvoice(e.target.value)}
  disabled={editingId !== null}
>
  {editingId === null && (
    <option value="">
      {tr("اختاري فاتورة", "Select Invoice")}
    </option>
  )}

  {invoices.map((inv) => (
    <option key={inv.id} value={inv.id}>
      SI-{String(inv.id).padStart(4, "0")}
      {" — "}
      {inv.customer_name || ""}
    </option>
  ))}
</select>
          </div>
          <br></br>
<div className="sales-return-invoice-section">
   {invoice && (
            <>
              <div className="invoice-info-grid">
                <p>
                  <strong>{tr("الزبون:", "Customer:")}</strong>{" "}
                  {invoice.customer_name || "-"}
                </p>

                <p>
                  <strong>{tr("المستودع:", "Warehouse:")}</strong>{" "}
                  {invoice.warehouse_name || "-"}
                </p>

                <p>
                  <strong>{tr("تاريخ الفاتورة:", "Invoice Date:")}</strong>{" "}
                  {formatDate(invoice.invoice_date)}
                </p>
              </div>

              <div className="table-wrapper">
                <table>
  <thead>
    <tr>
      <th>{tr("المادة", "Item")}</th>
      <th>{tr("كمية الفاتورة", "Invoice Qty")}</th>
      <th>{tr("المرتجعة", "Returned")}</th>
      <th>{tr("المتاحة", "Available")}</th>
      <th>{tr("سعر الوحدة USD", "Unit USD")}</th>
      <th>{tr("سعر الوحدة SYP", "Unit SYP")}</th>
      <th>{tr("كمية الإرجاع", "Return Qty")}</th>
    </tr>
  </thead>

  <tbody>
    {(invoice.items || []).map((item) => {
      const available = Number(item.available_return_quantity ?? 0);
      const returned = Number(item.returned_quantity ?? 0);

      return (
        <tr key={item.id}>
          <td>{item.item_name || "-"}</td>

          <td>{item.quantity}</td>

          <td>{returned}</td>

          <td
            style={{
              fontWeight: "bold",
              color: available > 0 ? "#15803d" : "#b91c1c",
            }}
          >
            {available}
          </td>

          <td>{item.unit_price_usd}</td>

          <td>{item.unit_price_syp}</td>

          <td>
            <input
              type="number"
              min="1"
              step="1"
              max={available}
              
              value={quantities[item.id] ?? ""}
              disabled={available <= 0}
              onChange={(e) => {
  const value = e.target.value;

  // السماح بتفريغ الحقل
  if (value === "") {
    setQuantities((prev) => ({
      ...prev,
      [item.id]: "",
    }));
    return;
  }

  // السماح بالأرقام الصحيحة الموجبة فقط
  if (!/^[0-9]+$/.test(value)) {
    return;
  }

  const quantity = Number(value);

  if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > available
    ) {
  return;
    }

  setQuantities((prev) => ({
    ...prev,
    [item.id]: value,
  }));
}}
              style={{
                width: 110,
                padding: 8,
              }}
            />
          </td>
        </tr>
      );
    })}

    {(invoice.items || []).length === 0 && (
      <tr>
        <td colSpan={7}>
          {tr(
            "لا توجد مواد في هذه الفاتورة.",
            "This invoice has no items."
          )}
        </td>
      </tr>
    )}
  </tbody>
</table>
              </div>
            </>
          )}
</div>
         

          <div style={{ marginTop: 16 }}>
            <label htmlFor="sales-return-reason">
              {tr("سبب الإرجاع", "Return Reason")}
            </label>

            <textarea
              id="sales-return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 8,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
           <button
  type="button"
  className="sales-return-save"
  onClick={saveReturn}
  disabled={saving || !invoice}
>
  {saving
  ? tr("جارٍ الحفظ...", "Saving...")
  : editingId !== null
    ? tr("حفظ التعديلات", "Save Changes")
    : tr("حفظ كمسودة", "Save Draft")}
</button>

            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={saving}
              className="sales-return-cancel"
            >
              {tr("إلغاء", "Cancel")}
             </button>
          </div>
        </div>
      </div>
    )}

      <div className="table-header">
        <div className="search-box">
          <input
            type="text"
            placeholder={tr(
              "بحث برقم المرتجع أو الفاتورة...",
              "Search returns..."
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          {["all", "draft", "confirmed"].map((status) => (
            <button
              key={status}
              className={
                filter === status
                  ? "filter-btn active"
                  : "filter-btn"
              }
              onClick={() => setFilter(status)}
            >
              {status === "all"
                ? tr("الكل", "All")
                : status === "draft"
                  ? tr("مسودة", "Draft")
                  : tr("مؤكد", "Confirmed")}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrapper">
        {loading ? (
          <p>{tr("جارٍ تحميل المرتجعات...", "Loading returns...")}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{tr("رقم المرتجع", "Return No.")}</th>
                <th>{tr("رقم الفاتورة", "Invoice No.")}</th>
                <th>{tr("التاريخ", "Date")}</th>
                <th>{tr("السبب", "Reason")}</th>
                <th>{tr("الحالة", "Status")}</th>
                <th>{tr("الإجمالي USD", "Total USD")}</th>
                <th>{tr("الإجمالي SYP", "Total SYP")}</th>
                <th>{tr("الإجراءات", "Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredReturns.map((item) => (
                <tr key={item.id}>
                  <td>
                    SR-{String(item.id).padStart(4, "0")}
                  </td>

                  <td>
                    SI-{String(item.invoice).padStart(4, "0")}
                  </td>

                  <td>{formatDate(item.return_date)}</td>
                  <td>{item.reason || "-"}</td>

                  <td>
                    {item.status === "draft"
                      ? tr("مسودة", "Draft")
                      : tr("مؤكد", "Confirmed")}
                  </td>

                  <td>{item.total_amount_usd}</td>
                  <td>{item.total_amount_syp}</td>

                 <td>
  {item.status === "draft" ? (
    <div className="return-actions">
   <button
  type="button"
        className="edit-btn"
  disabled={saving}
  onClick={() => startEditing(item)}
>
  {tr("تعديل", "Edit")}
</button>

      <button
        type="button"
        className="edit-btn"
        disabled={saving}
        onClick={() =>
              setConfirmModal({
                isOpen: true,
                type: "confirm",
                id: item.id,
              })
            }
      >
        {tr("تأكيد", "Confirm")}
      </button>
      <button
  type="button"
                                className="delete-btn"
  disabled={saving}
  onClick={() =>
  setConfirmModal({
    isOpen: true,
    type: "delete",
    id: item.id,
  })
}
  
>
  {tr("حذف", "Delete")}
</button>
    </div>
  ) : (
    <span>{tr("تم التأكيد", "Confirmed")}</span>
  )}
</td>
                </tr>
              ))}

              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    {tr(
                      "لا توجد مرتجعات مطابقة.",
                      "No matching returns found."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <AlertModal
  isOpen={!!alertMessage}
  title={tr("تنبيه", "Warning")}
  message={alertMessage}
  onClose={() => setAlertMessage("")}
/>
<ConfirmModal
  isOpen={confirmModal.isOpen}
  title={
    confirmModal.type === "delete"
      ? tr("حذف مسودة المرتجع", "Delete Return Draft")
      : tr("تأكيد مرتجع المبيعات", "Confirm Sales Return")
  }
  message={
    confirmModal.type === "delete"
      ? tr(
          "هل تريدين حذف هذه المسودة نهائيًا؟ لا يمكن التراجع عن الحذف.",
          "Delete this draft permanently? This action cannot be undone."
        )
      : tr(
          "هل تريدين تأكيد المرتجع؟ سيتم تحديث المخزون ولا يمكن تعديل المرتجع بعد التأكيد.",
          "Confirm this return? Inventory will be updated and the return cannot be edited afterward."
        )
  }
  danger={confirmModal.type === "delete"}
  loading={saving}
  onCancel={() =>
    setConfirmModal({
      isOpen: false,
      type: null,
      id: null,
    })
  }
  onConfirm={async () => {
    const { type, id } = confirmModal;

    setConfirmModal({
      isOpen: false,
      type: null,
      id: null,
    });

    if (type === "delete") {
      await deleteReturn(id);
    } else if (type === "confirm") {
      await confirmReturn(id);
    }
  }}
/>
    </>
  );
}

export default SalesReturnsPage;
