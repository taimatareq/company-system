import { useTranslation } from "react-i18next";

function SystemAdministrationPage({ setPage }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {t("system_administration")}
          </h1>

          <p className="page-subtitle">
            {t("manage_system_administration")}
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div
          className="dashboard-card"
          onClick={() => setPage("organizations")}
          style={{ cursor: "pointer" }}
        >
          <h3>{t("organizations")}</h3>
        </div>
      </div>
    </>
  );
}

export default SystemAdministrationPage;