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
  const [chartsReady, setChartsReady] =useState(false);
  const [monthlySales,setMonthlySales] = useState([]);
  const [financeData,setFinanceData]=useState({receivables:0,payables:0});
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

.then((responses)=>

Promise.all(

responses.map(
(r)=>r.json()
)

)

)

.then(([

sales,
purchases,
items,
customers,
suppliers,
inventoryData,
topItems,
monthlyTrend,
finance,

])=>{
console.log("FINANCE DATA:", finance);

setFinanceData(
finance
||{

receivables:0,

payables:0

}
);
setMonthlySales(

Array.isArray(
monthlyTrend
)

? monthlyTrend

: []

);
setTopSellingItems(

Array.isArray(topItems)

? topItems

: []

);

setSalesCount(

Array.isArray(sales)

?sales.length

:sales.results?.length||0

);

setPurchaseCount(

Array.isArray(purchases)

?purchases.length

:purchases.results?.length||0

);

setItemsCount(

Array.isArray(items)

?items.length

:items.results?.length||0

);

setCustomersCount(

Array.isArray(customers)

?customers.length

:customers.results?.length||0

);

setSuppliersCount(

Array.isArray(suppliers)

?suppliers.length

:suppliers.results?.length||0

);

const inventoryList =

Array.isArray(
inventoryData
)

? inventoryData

: inventoryData?.results || [];

setInventory(
inventoryList
);

setInventoryCount(
inventoryList.length
);
setTimeout(() => {
  setChartsReady(true);
}, 100);
})

.catch((err)=>{

console.error(err);

});

},[]);
  const COLORS = [

"#2563EB",

"#60A5FA",

"#CBD5E1",

"#93C5FD"

];
const operationChartData = [

{
name:"Purchase",

value:
inventory.filter(

(row)=>

row.operation_type==="purchase"

).length

},

{
name:"Sale",

value:
inventory.filter(

(row)=>

row.operation_type==="sale"

).length

},

{
name:"Damage",

value:
inventory.filter(

(row)=>

row.operation_type==="damage"

).length

}

];
const topSellingChartData =
(
topSellingItems || []
).map(
(item)=>({

name:item.name,

quantity:item.quantity

})
);
const monthlySalesChartData =
  (monthlySales || []).map((row) => ({
    month: row.month,
    total: Number(row.total || 0),
  }));const financeChartData=[

{

name:t("receivables"),

amount:
financeData.receivables

},

{

name:t("payables"),

amount:
financeData.payables

}

];
return (
  <div>
    <h1 className="page-title">{t("dashboard")}</h1>

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
        <h3>{t("inventory_movements")}</h3>
        <strong>{inventoryCount}</strong>
      </div>
    </div>

    <br />

    <div className="dashboard-charts-grid">
      <div className="card dashboard-chart-card">
        <h2>{t("inventory_operations")}</h2>

        <ResponsiveContainer width="100%" height={300}>
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
              {(operationChartData || []).map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* <div className="card dashboard-chart-card">
        <h2>{t("top_selling_items")}</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topSellingChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Bar
              dataKey="quantity"
              fill="#60A5FA"
            />
          </BarChart>
        </ResponsiveContainer>
      </div> */}

<div className="card dashboard-chart-card">

<h2>
{t("top_selling_items")}</h2>

<ResponsiveContainer
width="100%"
height={300}
>

<BarChart
data={
topSellingChartData
}
>

<XAxis
dataKey="name"
/>

<YAxis/>

<Tooltip/>

<Bar
dataKey="quantity"
fill="#60A5FA"
/>

</BarChart>

</ResponsiveContainer>

</div>
<div className="card dashboard-chart-card">
        <h2>{t("monthly_sales_trend")}</h2>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={monthlySalesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card dashboard-chart-card">
        <h2>{t("receivables_vs_payables")}</h2>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={financeChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Bar
              dataKey="amount"
              fill="#60A5FA"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
}

export default DashboardPage;