
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";

function SalesReturnsPage() {
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
    loadReturns();
  }, [loadReturns]);

  const startCreating = async () => {
    setError("");
    setNotice("");

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
        Number(quantities[item.id]) > Number(item.quantity)
    );

    if (invalidQuantity) {
      setError(
        tr(
          "كمية الإرجاع لا يمكن أن تتجاوز كمية الفاتورة.",
          "Return quantity cannot exceed invoice quantity."
        )
      );
      return;
    }

    const items = selectedItems.map((item) => ({
      invoice_item: item.id,
      quantity: quantities[item.id],
    }));

    setSaving(true);

    try {
      await request("/sales-returns/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice: Number(invoiceId),
          reason,
          items,
        }),
      });

      setCreating(false);

      setNotice(
        tr(
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

  const confirmReturn = async (id) => {
    const confirmed = window.confirm(
      tr(
        "هل تريدين تأكيد المرتجع؟ سيتم تحديث المخزون ولا يمكن تعديل المرتجع بعد التأكيد.",
        "Confirm this return? Inventory will be updated and the return cannot be edited afterward."
      )
    );

    if (!confirmed) return;

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

      {error && (
        <div className="card" role="alert">
          <p style={{ color: "#b91c1c" }}>{error}</p>
        </div>
      )}

      {notice && (
        <div className="card" role="status">
          <p style={{ color: "#15803d" }}>{notice}</p>
        </div>
      )}

      {creating && (
        <div className="card">
          <h3>
            {tr("إضافة مرتجع مبيعات", "Create Sales Return")}
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="sales-return-invoice">
              {tr("فاتورة المبيعات", "Sales Invoice")}
            </label>

            <select
              id="sales-return-invoice"
              value={invoiceId}
              onChange={(e) => selectInvoice(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 8,
              }}
            >
              <option value="">
                {tr("اختاري فاتورة", "Select Invoice")}
              </option>

              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  SI-{String(inv.id).padStart(4, "0")}
                  {" — "}
                  {inv.customer_name || ""}
                </option>
              ))}
            </select>
          </div>

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
                      <th>{tr("سعر الوحدة USD", "Unit USD")}</th>
                      <th>{tr("سعر الوحدة SYP", "Unit SYP")}</th>
                      <th>{tr("كمية الإرجاع", "Return Qty")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(invoice.items || []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.item_name || "-"}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit_price_usd}</td>
                        <td>{item.unit_price_syp}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            step="0.01"
                            value={quantities[item.id] ?? ""}
                            onChange={(e) =>
                              setQuantities((previous) => ({
                                ...previous,
                                [item.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: 110,
                              padding: 8,
                            }}
                          />
                        </td>
                      </tr>
                    ))}

                    {(invoice.items || []).length === 0 && (
                      <tr>
                        <td colSpan={5}>
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
              onClick={saveReturn}
              disabled={saving || !invoice}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "auto",
                minWidth: "120px",
                height: "40px",
                padding: "0 18px",
                border: "none",
                borderRadius: "9px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving || !invoice ? "not-allowed" : "pointer",
                opacity: saving || !invoice ? 0.6 : 1,
                flex: "0 0 auto",
                boxSizing: "border-box",
              }}
            >
              {saving
                ? tr("جارٍ الحفظ...", "Saving...")
                : tr("حفظ كمسودة", "Save Draft")}
            </button>

            <button
              type="button"
              onClick={() => setCreating(false)}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "auto",
                minWidth: "120px",
                height: "40px",
                padding: "0 18px",
                border: "1px solid #d1d5db",
                borderRadius: "9px",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                fontSize: "13px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                flex: "0 0 auto",
                boxSizing: "border-box",
              }}
            >
              {tr("إلغاء", "Cancel")}
            </button>
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
                      <button
                        className="add-btn"
                        disabled={saving}
                        onClick={() => confirmReturn(item.id)}
                      >
                        {tr("تأكيد", "Confirm")}
                      </button>
                    ) : (
                      <span>
                        {tr("تم التأكيد", "Confirmed")}
                      </span>
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
    </>
  );
}

export default SalesReturnsPage;
