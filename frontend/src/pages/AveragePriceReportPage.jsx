import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";

function AveragePriceReportPage({ setPage }) {
  const { t } = useTranslation();

  const [reportType, setReportType] = useState("sale");

  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [selectedItem, setSelectedItem] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const responses = await Promise.all([
          apiFetch("/items/"),
          apiFetch("/customers/"),
          apiFetch("/suppliers/"),
        ]);

        const [
          itemsData,
          customersData,
          suppliersData,
        ] = await Promise.all(
          responses.map((response) => response.json())
        );

        setItems(
          Array.isArray(itemsData)
            ? itemsData
            : itemsData.results || []
        );

        setCustomers(
          Array.isArray(customersData)
            ? customersData
            : customersData.results || []
        );

        setSuppliers(
          Array.isArray(suppliersData)
            ? suppliersData
            : suppliersData.results || []
        );
      } catch (err) {
        console.error(err);
        setError(t("average_price_filters_error"));
      }
    };

    loadFilters();
  }, [t]);

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (selectedItem) {
        params.append("item", selectedItem);
      }

      if (fromDate) {
        params.append("date_from", fromDate);
      }

      if (toDate) {
        params.append("date_to", toDate);
      }

      if (
        reportType === "sale" &&
        selectedCustomer
      ) {
        params.append(
          "customer",
          selectedCustomer
        );
      }

      if (
        reportType === "purchase" &&
        selectedSupplier
      ) {
        params.append(
          "supplier",
          selectedSupplier
        );
      }

      const endpoint =
        reportType === "sale"
          ? "/reports/average-sale-price/"
          : "/reports/average-purchase-price/";

      const query = params.toString();

      const response = await apiFetch(
        query
          ? `${endpoint}?${query}`
          : endpoint
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load average price report"
        );
      }

      const data = await response.json();

      setResults(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (err) {
      console.error(err);
      setError(t("average_price_report_error"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedItem("");
    setSelectedCustomer("");
    setSelectedSupplier("");
    setFromDate("");
    setToDate("");
    setResults([]);
    setError("");
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("average_price_report")}
          </h1>

          <p className="page-subtitle">
            {t("average_price_report_subtitle")}
          </p>
        </div>

        <button
          className="back-btn"
          onClick={() => setPage("reports")}
        >
          ← {t("back")}
        </button>
      </div>

      <div className="filters-container">
        <select
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value);
            setSelectedCustomer("");
            setSelectedSupplier("");
            setResults([]);
          }}
        >
          <option value="sale">
            {t("average_sale_price")}
          </option>

          <option value="purchase">
            {t("average_purchase_price")}
          </option>
        </select>

        <select
          value={selectedItem}
          onChange={(e) =>
            setSelectedItem(e.target.value)
          }
        >
          <option value="">
            {t("all_items")}
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

        {reportType === "sale" && (
          <select
            value={selectedCustomer}
            onChange={(e) =>
              setSelectedCustomer(
                e.target.value
              )
            }
          >
            <option value="">
              {t("all_customers")}
            </option>

            {customers.map(
              (customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                </option>
              )
            )}
          </select>
        )}

        {reportType === "purchase" && (
          <select
            value={selectedSupplier}
            onChange={(e) =>
              setSelectedSupplier(
                e.target.value
              )
            }
          >
            <option value="">
              {t("all_suppliers")}
            </option>

            {suppliers.map(
              (supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              )
            )}
          </select>
        )}

        <input
          type="date"
          value={fromDate}
          onChange={(e) =>
            setFromDate(e.target.value)
          }
          title={t("from_date")}
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) =>
            setToDate(e.target.value)
          }
          title={t("to_date")}
        />

        <button
          className="filter-btn"
          onClick={loadReport}
        >
          {t("show_report")}
        </button>

        <button
          className="clear-filters-btn"
          onClick={clearFilters}
        >
          {t("clear_filters")}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="card">
          {t("loading_report")}
        </div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t("item")}</th>
                <th>{t("total_quantity")}</th>
                <th>{t("average_price_usd")}</th>
                <th>{t("average_price_syp")}</th>
                <th>{t("min_price_usd")}</th>
                <th>{t("max_price_usd")}</th>
                <th>{t("invoices")}</th>
              </tr>
            </thead>

            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#6B7280",
                    }}
                  >
                    {t("no_report_results")}
                  </td>
                </tr>
              ) : (
                results.map((row) => (
                  <tr key={row.item_id}>
                    <td>{row.item_name}</td>

                    <td>
                      {formatNumber(
                        row.total_quantity
                      )}
                    </td>

                    <td>
                      $
                      {formatNumber(
                        row.average_price_usd
                      )}
                    </td>

                    <td>
                      {formatNumber(
                        row.average_price_syp
                      )}{" "}
                      SYP
                    </td>

                    <td>
                      $
                      {formatNumber(
                        row.min_price_usd
                      )}
                    </td>

                    <td>
                      $
                      {formatNumber(
                        row.max_price_usd
                      )}
                    </td>

                    <td>
                      {row.invoice_count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default AveragePriceReportPage;