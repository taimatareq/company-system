import { useEffect, useState } from "react";
import { apiFetch } from "../api";

import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { useTranslation } from "react-i18next";

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
        Promise.all(
          responses.map((response) => response.json())
        )
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
          console.log("FINANCE DATA:", finance);

          // =========================
          // FINANCE
          // =========================

          setFinanceData(
            finance || {
              receivables: 0,
              payables: 0,
            }
          );

          // =========================
          // MONTHLY SALES
          // =========================

          setMonthlySales(
            Array.isArray(monthlyTrend)
              ? monthlyTrend
              : []
          );

          // =========================
          // TOP SELLING ITEMS
          // =========================

          setTopSellingItems(
            Array.isArray(topItems)
              ? topItems
              : []
          );

          // =========================
          // COUNTS
          // =========================

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

          // =========================
          // INVENTORY
          // =========================

          const inventoryList =
            Array.isArray(inventoryData)
              ? inventoryData
              : inventoryData?.results || [];

          setInventory(inventoryList);

          setInventoryCount(
            inventoryList.length
          );
        }
      )

      .catch((err) => {
        console.error(err);
      });
  }, []);

  // =========================
  // EMESA COLORS
  // =========================

  const COLORS = [
    "#078B9A",
    "#42B8C4",
    "#9EDDE3",
    "#D7F0F2",
  ];

  // =========================
  // INVENTORY OPERATIONS
  // =========================

  const operationChartData = [
    {
      name: "Purchase",

      value: inventory.filter(
        (row) =>
          row.operation_type === "purchase"
      ).length,
    },

    {
      name: "Sale",

      value: inventory.filter(
        (row) =>
          row.operation_type === "sale"
      ).length,
    },

    {
      name: "Damage",

      value: inventory.filter(
        (row) =>
          row.operation_type === "damage"
      ).length,
    },
  ];

  // =========================
  // TOP SELLING ITEMS
  // =========================

  const topSellingChartData = (
    topSellingItems || []
  ).map((item) => ({
    name: item.name,
    quantity: item.quantity,
  }));

  // =========================
  // MONTHLY SALES
  // =========================

  const monthlySalesChartData = (
    monthlySales || []
  ).map((row) => ({
    month: row.month,
    total: Number(row.total || 0),
  }));

  // =========================
  // RECEIVABLES / PAYABLES
  // =========================

  const financeChartData = [
    {
      name: t("receivables"),
      amount: Number(
        financeData.receivables || 0
      ),
    },

    {
      name: t("payables"),
      amount: Number(
        financeData.payables || 0
      ),
    },
  ];
const CustomItemTick = ({ x, y, payload }) => {
  return (
    <text
      x={x - 10}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#1E293B"
      fontSize={13}
      fontWeight={600}
      direction="ltr"
    >
      {payload.value}
    </text>
  );
};
  return (
    <div>
      {/* =========================
          PAGE TITLE
      ========================= */}

      <h1 className="page-title">
        {t("dashboard")}
      </h1>

      {/* =========================
          STAT CARDS
      ========================= */}

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <h3>{t("sales_invoices")}</h3>
          <strong>{salesCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>{t("purchase_invoices")}</h3>
          <strong>{purchaseCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>{t("items")}</h3>
          <strong>{itemsCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>{t("customers")}</h3>
          <strong>{customersCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>{t("suppliers")}</h3>
          <strong>{suppliersCount}</strong>
        </div>

        <div className="dashboard-card">
          <h3>
            {t("inventory_movements")}
          </h3>

          <strong>
            {inventoryCount}
          </strong>
        </div>

      </div>

      {/* =========================
          CHARTS
      ========================= */}

      <div className="dashboard-charts-grid">

        {/* INVENTORY OPERATIONS */}

        <div className="card dashboard-chart-card">

          <h2>
            {t("inventory_operations")}
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>

              <Pie
                data={operationChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                innerRadius={45}
                paddingAngle={3}
                cornerRadius={8}
              >
                {operationChartData.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* TOP SELLING ITEMS */}

        <div className="card dashboard-chart-card">

          <h2>
            {t("top_selling_items")}
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={topSellingChartData}
              layout="vertical"
              margin={{
                top: 10,
                right: 25,
                left: 40,
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
    fontWeight: 500,
  }}
/>
<YAxis
  type="category"
  dataKey="name"
  width={190}
  axisLine={false}
  tickLine={false}
  tick={<CustomItemTick />}
/>
{/* 
<YAxis
  type="category"
  dataKey="name"
  width={150}
  axisLine={false}
  tickLine={false}
  tick={{
    fill: "#1E293B",
    fontSize: 13,
    fontWeight: 600,
  }}
/> */}

              <Tooltip />

              <Bar
                dataKey="quantity"
                fill="#2AA6B3"
                radius={[0, 8, 8, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* MONTHLY SALES TREND */}

        <div className="card dashboard-chart-card">

  <h2>
    {t("top_selling_items")}
  </h2>

  <div
    className="top-selling-chart"
    dir="ltr"
  >

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <LineChart
              data={monthlySalesChartData}
            >

              <CartesianGrid
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fill: "#64748B",
                  fontSize: 12,
                }}
                axisLine={{
                  stroke: "#CBD5E1",
                }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: "#64748B",
                  fontSize: 12,
                }}
                axisLine={false}
                tickLine={false}
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

        {/* RECEIVABLES VS PAYABLES */}

        <div className="card dashboard-chart-card">

          <h2>
            {t("receivables_vs_payables")}
          </h2>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <BarChart
              data={financeChartData}
              margin={{
                top: 10,
                right: 25,
                left: 70,
                bottom: 10,
              }}
            >

              <XAxis
                dataKey="name"
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

              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
              >
                {financeChartData.map(
                  (entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        index === 0
                          ? "#078B9A"
                          : "#42B8C4"
                      }
                    />
                  )
                )}
              </Bar>

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>
    </div>
  );
}

export default DashboardPage;