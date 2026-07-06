import { useTranslation } from "react-i18next";

function ReportsPage() {
  const { t } = useTranslation();

  const reportGroups = [
    {
      title: "operational_reports",
      reports: [
        {
          title: "sales_report",
          desc: "sales_analytics",
          icon: "📈",
          page: "sales-report",
        },
        {
          title: "purchase_report",
          desc: "purchase_analytics",
          icon: "📦",
          page: "purchases-report",
        },
        {
          title: "inventory_report",
          desc: "stock_and_valuation",
          icon: "📊",
          page: "inventory-report",
        },
      ],
    },
    {
      title: "financial_reports",
      reports: [
        {
          title: "customer_debts",
          desc: "customer_balances",
          icon: "👤",
          page: "customer-statement",
        },
        {
          title: "supplier_debts",
          desc: "supplier_balances",
          icon: "🏢",
          page: "supplier-statement",
        },
        // {
        //   title: "payments_report",
        //   desc: "cash_movements",
        //   icon: "💰",
        //   page: "payments-report",
        // },
      ],
    },
  ];

  return (
  <>
    <div className="page-header">
      <div>
        <h1 className="page-title">{t("reports")}</h1>
        <p className="page-subtitle">{t("view_system_reports")}</p>
      </div>
    </div>

    {reportGroups.map((group) => (
      <div key={group.title} className="reports-section">
        <h2>{t(group.title)}</h2>

        <div className="reports-grid">
          {group.reports.map((report) => (
            <div
              key={report.page}
              className="report-card"
              onClick={() => {
                localStorage.setItem("page", report.page);
                window.location.reload();
              }}
            >
              <div className="report-icon">{report.icon}</div>

              <div className="report-title">
                {t(report.title)}
              </div>

              <div className="report-desc">
                {t(report.desc)}
              </div>

              <div className="report-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </>
);
}

export default ReportsPage;