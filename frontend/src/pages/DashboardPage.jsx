import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useTranslation } from "react-i18next";
import {
  FiFileText,
  FiShoppingCart,
  FiArrowDownCircle,
  FiArrowUpCircle,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

function DashboardPage() {
  const { t } = useTranslation();

  const [salesCount, setSalesCount] = useState(0);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState(0);

  const [inventory, setInventory] = useState([]);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);

  const [financeData, setFinanceData] = useState({
    receivables: 0,
    payables: 0,
  });

  useEffect(() => {
    Promise.all([
      apiFetch("/sales-invoices/"),
      apiFetch("/purchase-invoices/"),
      apiFetch("/items/"),
      apiFetch("/customers/"),
      apiFetch("/suppliers/"),
      apiFetch("/inventory/"),
      apiFetch("/top-selling-items/"),
      apiFetch("/monthly-sales-trend/"),
      apiFetch("/receivables-payables/"),
    ])
      .then((responses) =>
        Promise.all(responses.map((response) => response.json()))
      )
      .then(
        ([
          sales,
          purchases,
          items,
          customers,
          suppliers,
          inventoryData,
          topItems,
          monthlyTrend,
          finance,
        ]) => {
          setSalesCount(
            Array.isArray(sales)
              ? sales.length
              : sales.results?.length || 0
          );

          setPurchaseCount(
            Array.isArray(purchases)
              ? purchases.length
              : purchases.results?.length || 0
          );

          setItemsCount(
            Array.isArray(items)
              ? items.length
              : items.results?.length || 0
          );

          setCustomersCount(
            Array.isArray(customers)
              ? customers.length
              : customers.results?.length || 0
          );

          setSuppliersCount(
            Array.isArray(suppliers)
              ? suppliers.length
              : suppliers.results?.length || 0
          );

          const inventoryList = Array.isArray(inventoryData)
            ? inventoryData
            : inventoryData?.results || [];

          setInventory(inventoryList);
          setInventoryCount(inventoryList.length);

          setTopSellingItems(
            Array.isArray(topItems) ? topItems : []
          );

          setMonthlySales(
            Array.isArray(monthlyTrend) ? monthlyTrend : []
          );

          setFinanceData(
            finance || {
              receivables: 0,
              payables: 0,
            }
          );
        }
      )
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const COLORS = [
    "#078B9A",
    "#42B8C4",
    "#9EDDE3",
    "#D7F0F2",
  ];

  const operationChartData = [
    {
      name: t("purchase"),
      value: inventory.filter(
        (row) => row.operation_type === "purchase"
      ).length,
    },
    {
      name: t("sale"),
      value: inventory.filter(
        (row) => row.operation_type === "sale"
      ).length,
    },
    {
      name: t("damage"),
      value: inventory.filter(
        (row) => row.operation_type === "damage"
      ).length,
    },
  ];

  const topSellingChartData = (topSellingItems || []).map(
    (item) => ({
      name: item.name,
      quantity: item.quantity,
    })
  );

  const monthlySalesChartData = (monthlySales || []).map(
    (row) => ({
      month: row.month,
      total: Number(row.total || 0),
    })
  );

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString();
  };
const CustomItemTick = ({ x, y, payload }) => {
  return (
    <text
      x={x - 12}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#334155"
      fontSize={12}
      fontWeight={500}
      direction="ltr"
    >
      {payload.value}
    </text>
  );
};
  return (
    <div className="modern-dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">{t("dashboard")}</h1>
          <p className="dashboard-subtitle">
            {t("business_overview")}
          </p>
        </div>
      </div>

      {/* MAIN KPI CARDS */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-icon">
  <FiFileText size={22} />
</div>
          <div>
            <span className="dashboard-kpi-label">
              {t("sales_invoices")}
            </span>

            <strong className="dashboard-kpi-value">
              {salesCount}
            </strong>

            <span className="dashboard-kpi-description">
              {t("total_sales_invoices")}
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
<div className="dashboard-kpi-icon">
  <FiShoppingCart size={22} />
</div>
          <div>
           {/* Sales */}
{/* <div className="dashboard-kpi-icon">
  <FiFileText size={22} />
</div> */}
<span className="dashboard-kpi-label">
              {t("purchase_invoices")}
            </span>
            <strong className="dashboard-kpi-value">
              {purchaseCount}
            </strong>

            <span className="dashboard-kpi-description">
              {t("total_purchase_invoices")}
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
<div className="dashboard-kpi-icon">
  <FiArrowDownCircle size={22} />
</div>
          <div>
            <span className="dashboard-kpi-label">
              {t("receivables")}
            </span>

            <strong className="dashboard-kpi-value">
              ${formatMoney(financeData.receivables)}
            </strong>

            <span className="dashboard-kpi-description">
              {t("customer_outstanding_balance")}
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
<div className="dashboard-kpi-icon">
  <FiArrowUpCircle size={22} />
</div>
          <div>
            <span className="dashboard-kpi-label">
              {t("payables")}
            </span>

            <strong className="dashboard-kpi-value">
              ${formatMoney(financeData.payables)}
            </strong>

            <span className="dashboard-kpi-description">
              {t("supplier_outstanding_balance")}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN ANALYTICS */}
      <div className="dashboard-main-grid">
        {/* SALES OVERVIEW */}
        <div className="dashboard-panel dashboard-sales-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{t("sales_overview")}</h2>
              <p>{t("monthly_sales_performance")}</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlySalesChartData}>
                <CartesianGrid
                  stroke="#E8EEF0"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#078B9A"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#078B9A",
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#42B8C4",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP SELLING */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{t("top_selling_items")}</h2>
              <p>{t("best_performing_items")}</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
  data={topSellingChartData}
  layout="vertical"
  margin={{
    top: 10,
    right: 20,
    left: 90,
    bottom: 10,
  }}
>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748B",
                    fontSize: 12,
                  }}
                />

     <YAxis
  type="category"
  dataKey="name"
  width={200}
  axisLine={false}
  tickLine={false}
  tick={<CustomItemTick />}
/>

                <Tooltip />

                <Bar
                  dataKey="quantity"
                  fill="#42B8C4"
                  radius={[0, 7, 7, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="dashboard-bottom-grid">
        {/* INVENTORY */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{t("inventory_activity")}</h2>
              <p>{t("inventory_operations_summary")}</p>
            </div>
          </div>

          <div className="inventory-donut-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={operationChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  cornerRadius={7}
                >
                  {operationChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="inventory-donut-center">
              <strong>{inventoryCount}</strong>
              <span>{t("movements")}</span>
            </div>
          </div>

          <div className="dashboard-legend">
            {operationChartData.map((item, index) => (
              <div
                className="dashboard-legend-item"
                key={item.name}
              >
                <span
                  className="dashboard-legend-dot"
                  style={{
                    backgroundColor:
                      COLORS[index % COLORS.length],
                  }}
                />

                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* BUSINESS SUMMARY */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>{t("business_summary")}</h2>
              <p>{t("business_data_summary")}</p>
            </div>
          </div>

          <div className="dashboard-summary-list">
            <div className="dashboard-summary-row">
              <span>{t("items")}</span>
              <strong>{itemsCount}</strong>
            </div>

            <div className="dashboard-summary-row">
              <span>{t("customers")}</span>
              <strong>{customersCount}</strong>
            </div>

            <div className="dashboard-summary-row">
              <span>{t("suppliers")}</span>
              <strong>{suppliersCount}</strong>
            </div>

            <div className="dashboard-summary-row">
              <span>{t("inventory_movements")}</span>
              <strong>{inventoryCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;