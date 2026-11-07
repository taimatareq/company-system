import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import AlertModal from "../components/common/AlertModal";
import ConfirmModal from "../components/common/ConfirmModal";

function PurchaseReturnsPage() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith("ar");
  const tr = (arabic, english) => (ar ? arabic : english);

  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    id: null,
  });

  const formatBackendError = (message) => {
    let value = String(message || "");
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        value = parsed;
      } else if (parsed && typeof parsed === "object") {
        const flatten = (part) => {
          if (Array.isArray(part)) return part.map(flatten).join(" ");
          if (part && typeof part === "object") {
            return Object.values(part).map(flatten).join(" ");
          }
          return String(part ?? "");
        };
        value = flatten(parsed);
      }
    } catch (_) {
      // Plain-text API error.
    }

    if (!ar) return value;

    const unavailable = value.match(
      /Cannot return ([\d.]+) units(?: of invoice item \d+)?\. Only ([\d.]+) units are available\./i
    );
    if (unavailable) {
      return `لا يمكن إرجاع كمية ${unavailable[1]}. الكمية المتاحة للإرجاع هي ${unavailable[2]} فقط.`;
    }

    const insufficientStock = value.match(
      /Not enough stock for (.+?)\. Available: ([\d.]+)/i
    );
    if (insufficientStock) {
      return `المخزون غير كافٍ للمادة ${insufficientStock[1]}. الكمية المتوفرة: ${insufficientStock[2]}.`;
    }

    const translations = {
      "Only draft purchase returns can be confirmed.": "يمكن تأكيد مرتجعات المشتريات التي بحالة مسودة فقط.",
      "Only draft returns can be modified.": "يمكن تعديل المرتجعات التي بحالة مسودة فقط.",
      "The original purchase invoice must be applied first.": "يجب اعتماد فاتورة المشتريات الأصلية أولًا.",
      "Cannot confirm an empty purchase return.": "لا يمكن تأكيد مرتجع مشتريات بدون مواد.",
      "Return quantity must be greater than zero.": "يجب أن تكون كمية الإرجاع أكبر من صفر.",
      "Return quantity must be a whole number.": "يجب أن تكون كمية الإرجاع عددًا صحيحًا.",
      "Quantity must be greater than zero.": "يجب أن تكون الكمية أكبر من صفر.",
      "Invalid return quantity.": "كمية الإرجاع غير صالحة.",
      "An item does not belong to this invoice.": "المادة المختارة لا تتبع لهذه الفاتورة.",
      "This item does not belong to the selected invoice.": "المادة المختارة لا تتبع للفاتورة المحددة.",
      "At least one return item is required.": "يجب إضافة مادة واحدة على الأقل للمرتجع.",
      "An invoice is required.": "يجب اختيار فاتورة.",
      "The original invoice cannot be changed.": "لا يمكن تغيير الفاتورة الأصلية.",
      "Ensure that there are no more than 2 decimal places.": "يُسمح بمنزلتين عشريتين كحد أقصى.",
    };

    for (const [english, arabic] of Object.entries(translations)) {
      if (value.includes(english)) return value.replace(english, arabic);
    }
    return value;
  };

  const showError = (error) => {
    setAlertMessage(formatBackendError(error?.message || error));
  };

  const request = async (url, options) => {
    const response = await apiFetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof data?.detail === "string" ? data.detail : JSON.stringify(data)
      );
    }
    return data;
  };

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/purchase-returns/");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(JSON.stringify(data));
      setReturns(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  // This callback only needs to run on initial mount or after a mutation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const closeForm = () => {
    if (saving) return;
    setCreating(false);
    setEditingId(null);
  };

  const startCreating = async () => {
    setAlertMessage("");
    setEditingId(null);
    try {
      const data = await request("/purchase-invoices/");
      setInvoices(Array.isArray(data) ? data : data.results || []);
      setInvoice(null);
      setInvoiceId("");
      setQuantities({});
      setReason("");
      setCreating(true);
    } catch (err) {
      showError(err);
    }
  };

  const startEditing = async (item) => {
    if (item.status !== "draft") return;
    setAlertMessage("");
    try {
      const [returnData, invoiceData] = await Promise.all([
        request(`/purchase-returns/${item.id}/`),
        request(`/purchase-invoices/${item.invoice}/`),
      ]);
      if (returnData.status !== "draft") {
        setAlertMessage(tr("لا يمكن تعديل مرتجع تم تأكيده.", "Confirmed returns cannot be edited."));
        return;
      }
      const existingQuantities = {};
      (returnData.items || []).forEach((returnItem) => {
        const invoiceItemId =
          typeof returnItem.invoice_item === "object"
            ? returnItem.invoice_item.id
            : returnItem.invoice_item;
        existingQuantities[invoiceItemId] = String(returnItem.quantity);
      });
      setEditingId(item.id);
      setInvoices([invoiceData]);
      setInvoice(invoiceData);
      setInvoiceId(String(invoiceData.id));
      setQuantities(existingQuantities);
      setReason(returnData.reason || "");
      setCreating(true);
    } catch (err) {
      showError(err);
    }
  };

  const selectInvoice = async (id) => {
    setInvoiceId(id);
    setInvoice(null);
    setQuantities({});
    setAlertMessage("");
    if (!id) return;
    try {
      setInvoice(await request(`/purchase-invoices/${id}/`));
    } catch (err) {
      showError(err);
    }
  };

  const saveReturn = async () => {
    setAlertMessage("");
    if (!invoice || !invoiceId) {
      setAlertMessage(tr("اختاري فاتورة أولًا.", "Select an invoice first."));
      return;
    }

    const enteredValues = (invoice.items || []).map((item) => ({
      item,
      raw: String(quantities[item.id] ?? "").trim(),
    }));
    const invalid = enteredValues.some(({ raw }) => {
      if (raw === "") return false;
      const number = Number(raw);
      return !/^\d+(?:\.0+)?$/.test(raw) || !Number.isSafeInteger(number) || number < 1;    });
    if (invalid) {
      setAlertMessage(tr("كمية الإرجاع يجب أن تكون عددًا صحيحًا أكبر من صفر.", "Return quantity must be a whole number greater than zero."));
      return;
    }

    const selected = enteredValues.filter(({ raw }) => raw !== "");
    if (selected.length === 0) {
      setAlertMessage(tr("حددي كمية مادة واحدة على الأقل.", "Enter a return quantity for at least one item."));
      return;
    }

    const exceedsAvailable = selected.some(({ item, raw }) =>
      Number(raw) > Number(item.available_return_quantity ?? 0)
    );
    if (exceedsAvailable) {
      setAlertMessage(tr(
        "كمية الإرجاع لا يمكن أن تتجاوز الكمية المتاحة بعد المرتجعات المؤكدة.",
        "Return quantity cannot exceed the available quantity after confirmed returns."
      ));
      return;
    }

    const items = selected.map(({ item, raw }) => ({
      invoice_item: item.id,
      quantity: Number(raw),
    }));
    const isEditing = editingId !== null;
    setSaving(true);
    try {
      await request(
        isEditing ? `/purchase-returns/${editingId}/` : "/purchase-returns/",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEditing
              ? { reason, items }
              : { invoice: Number(invoiceId), reason, items }
          ),
        }
      );
      setCreating(false);
      setEditingId(null);
      await loadReturns();
      setAlertMessage(isEditing
        ? tr("تم حفظ تعديلات المرتجع بنجاح.", "Return updated successfully.")
        : tr("تم إنشاء المرتجع كمسودة بنجاح.", "Return draft created successfully."));
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteReturn = async (id) => {
    setSaving(true);
    setAlertMessage("");
    try {
      await request(`/purchase-returns/${id}/`, { method: "DELETE" });
      await loadReturns();
      setAlertMessage(tr("تم حذف مسودة المرتجع بنجاح.", "Return draft deleted successfully."));
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmReturn = async (id) => {
    setSaving(true);
    setAlertMessage("");
    try {
      await request(`/purchase-returns/${id}/confirm/`, { method: "POST" });
      await loadReturns();
      setAlertMessage(tr("تم تأكيد المرتجع وتحديث المخزون.", "Return confirmed and inventory updated."));
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      String(item.id).includes(search) ||
      String(item.invoice).includes(search) ||
      (item.reason || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (filter === "all" || item.status === filter);
  });

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(ar ? "ar-SY" : "en-US");
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tr("مرتجعات المشتريات", "Purchase Returns")}</h1>
          <p className="page-subtitle">
            {tr("إدارة المرتجعات المرتبطة بفواتير المشتريات", "Manage returns associated with purchase invoices")}
          </p>
        </div>
        <button className="add-btn" onClick={startCreating} disabled={saving}>
          {tr("+ إضافة مرتجع", "+ New Return")}
        </button>
      </div>

      {creating && (
        <div className="modal-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="sales-return-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-return-modal-title">
            <div className="sales-return-modal-header">
              <h3 id="purchase-return-modal-title">
                {editingId !== null
                  ? tr("تعديل مرتجع مشتريات", "Edit Purchase Return")
                  : tr("إضافة مرتجع مشتريات", "Create Purchase Return")}
              </h3>
              <button type="button" className="sales-return-modal-close"
                aria-label={tr("إغلاق", "Close")} onClick={closeForm} disabled={saving}>×</button>
            </div>

            <div>
              <label htmlFor="purchase-return-invoice">{tr("فاتورة المشتريات", "Purchase Invoice")}</label>
              <select id="purchase-return-invoice" value={invoiceId}
                onChange={(event) => selectInvoice(event.target.value)} disabled={editingId !== null}>
                {editingId === null && <option value="">{tr("اختاري فاتورة", "Select Invoice")}</option>}
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    PI-{String(inv.id).padStart(4, "0")}{" — "}{inv.supplier_name || inv.supplier || ""}
                  </option>
                ))}
              </select>
            </div>

            {invoice && (
              <div className="sales-return-invoice-section" style={{ marginTop: 16 }}>
                <div className="invoice-info-grid">
                  <p><strong>{tr("المورد:", "Supplier:")}</strong>{" "}{invoice.supplier_name || invoice.supplier || "-"}</p>
                  <p><strong>{tr("المستودع:", "Warehouse:")}</strong>{" "}{invoice.warehouse_name || invoice.warehouse || "-"}</p>
                  <p><strong>{tr("تاريخ الفاتورة:", "Invoice Date:")}</strong>{" "}{formatDate(invoice.invoice_date)}</p>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr("المادة", "Item")}</th>
                        <th>{tr("كمية الفاتورة", "Invoice Qty")}</th>
                        <th>{tr("المرتجعة", "Returned")}</th>
                        <th>{tr("المتاحة", "Available")}</th>
                        <th>{tr("تكلفة الوحدة USD", "Unit Cost USD")}</th>
                        <th>{tr("تكلفة الوحدة SYP", "Unit Cost SYP")}</th>
                        <th>{tr("كمية الإرجاع", "Return Qty")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoice.items || []).map((item) => {
                        const available = Number(item.available_return_quantity ?? 0);
                        const returned = Number(item.returned_quantity ?? 0);
                        return (
                          <tr key={item.id}>
                            <td>{item.item_name || item.item || "-"}</td>
                            <td>{item.quantity}</td>
                            <td>{returned}</td>
                            <td style={{ fontWeight: "bold", color: available > 0 ? "#15803d" : "#b91c1c" }}>
                              {available}
                            </td>
                            <td>{item.unit_cost_usd}</td>
                            <td>{item.unit_cost_syp}</td>
                            <td>
                              <input type="number" min="1" step="1" max={available}
                                value={quantities[item.id] ?? ""}
                                disabled={saving || available <= 0}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  if (value === "") {
                                    setQuantities((prev) => ({ ...prev, [item.id]: "" }));
                                    return;
                                  }
                                  if (!/^-?\d+(?:\.0*)?$/.test(value)) return;
                                  const quantity = Number(value);
                                  if (quantity < 1) {
                                  setAlertMessage(tr("كمية الإرجاع يجب أن تكون أكبر من صفر.", "Return quantity must be greater than zero."));
                                  return;
}
if (!Number.isSafeInteger(quantity) || quantity > available) return;
                                  setQuantities((prev) => ({ ...prev, [item.id]: value }));
                                }}
                                style={{ width: 110, padding: 8 }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {(invoice.items || []).length === 0 && (
                        <tr><td colSpan={7}>{tr("لا توجد مواد في هذه الفاتورة.", "This invoice has no items.")}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <label htmlFor="purchase-return-reason">{tr("سبب الإرجاع", "Return Reason")}</label>
              <textarea id="purchase-return-reason" value={reason}
                onChange={(event) => setReason(event.target.value)} rows={3}
                style={{ display: "block", width: "100%", padding: 10, marginTop: 8, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
              <button type="button" className="sales-return-save" onClick={saveReturn} disabled={saving || !invoice}>
                {saving ? tr("جارٍ الحفظ...", "Saving...")
                  : editingId !== null ? tr("حفظ التعديلات", "Save Changes")
                    : tr("حفظ كمسودة", "Save Draft")}
              </button>
              <button type="button" className="sales-return-cancel" onClick={closeForm} disabled={saving}>
                {tr("إلغاء", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-header">
        <div className="search-box">
          <input type="text" placeholder={tr("بحث برقم المرتجع أو الفاتورة...", "Search returns...")}
            value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="filter-buttons">
          {["all", "draft", "confirmed"].map((status) => (
            <button key={status} className={filter === status ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilter(status)}>
              {status === "all" ? tr("الكل", "All")
                : status === "draft" ? tr("مسودة", "Draft") : tr("مؤكد", "Confirmed")}
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrapper">
        {loading ? <p>{tr("جارٍ تحميل المرتجعات...", "Loading returns...")}</p> : (
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
                  <td>PR-{String(item.id).padStart(4, "0")}</td>
                  <td>PI-{String(item.invoice).padStart(4, "0")}</td>
                  <td>{formatDate(item.return_date)}</td>
                  <td>{item.reason || "-"}</td>
                  <td>{item.status === "draft" ? tr("مسودة", "Draft") : tr("مؤكد", "Confirmed")}</td>
                  <td>{item.total_amount_usd}</td>
                  <td>{item.total_amount_syp}</td>
                  <td>
                    {item.status === "draft" ? (
                      <div className="return-actions">
                        <button type="button" className="edit-btn" disabled={saving} onClick={() => startEditing(item)}>
                          {tr("تعديل", "Edit")}
                        </button>
                        <button type="button" className="edit-btn" disabled={saving}
                          onClick={() => setConfirmModal({ isOpen: true, type: "confirm", id: item.id })}>
                          {tr("تأكيد", "Confirm")}
                        </button>
                        <button type="button" className="delete-btn" disabled={saving}
                          onClick={() => setConfirmModal({ isOpen: true, type: "delete", id: item.id })}>
                          {tr("حذف", "Delete")}
                        </button>
                      </div>
                    ) : <span>{tr("تم التأكيد", "Confirmed")}</span>}
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr><td colSpan={8}>{tr("لا توجد مرتجعات مطابقة.", "No matching returns found.")}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AlertModal isOpen={!!alertMessage} title={tr("تنبيه", "Notice")}
        message={alertMessage} onClose={() => setAlertMessage("")} />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === "delete"
          ? tr("حذف مسودة المرتجع", "Delete Return Draft")
          : tr("تأكيد مرتجع المشتريات", "Confirm Purchase Return")}
        message={confirmModal.type === "delete"
          ? tr("هل تريدين حذف هذه المسودة نهائيًا؟ لا يمكن التراجع عن الحذف.", "Delete this draft permanently? This action cannot be undone.")
          : tr("هل تريدين تأكيد المرتجع؟ سيتم تحديث المخزون ولا يمكن تعديل المرتجع بعد التأكيد.", "Confirm this return? Inventory will be updated and the return cannot be edited afterward.")}
        danger={confirmModal.type === "delete"}
        loading={saving}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
        onConfirm={async () => {
          const { type, id } = confirmModal;
          setConfirmModal({ isOpen: false, type: null, id: null });
          if (type === "delete") await deleteReturn(id);
          else if (type === "confirm") await confirmReturn(id);
        }}
      />
    </>
  );
}

export default PurchaseReturnsPage;
