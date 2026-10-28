import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api";


function StockTransfersPage({ setPage }) {
  const { t, i18n } = useTranslation();

  const [transfers, setTransfers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  const isArabic =
    i18n.language?.startsWith("ar");


  useEffect(() => {
    loadTransfers();
  }, []);


  const loadTransfers = async () => {
    try {
      setLoading(true);

      const response =
        await apiFetch(
          "/stock-transfers/"
        );

      const data =
        await response.json();


      if (!response.ok) {
        console.error(
          "Error loading transfers:",
          data
        );

        setTransfers([]);

        return;
      }


      const transfersList =
        Array.isArray(data)
          ? data
          : data.results || [];


      setTransfers(
        transfersList
      );

    } catch (error) {
      console.error(
        "Error loading stock transfers:",
        error
      );

      setTransfers([]);

    } finally {
      setLoading(false);
    }
  };


  const openCreatePage = () => {
    localStorage.removeItem(
      "selectedStockTransfer"
    );

    localStorage.setItem(
      "stockTransferMode",
      "create"
    );

    setPage(
      "stock-transfer-form"
    );
  };


  const openViewPage = (
    transferId
  ) => {
    localStorage.setItem(
      "selectedStockTransfer",
      transferId
    );

    localStorage.setItem(
      "stockTransferMode",
      "view"
    );

    setPage(
      "stock-transfer-form"
    );
  };


  const openEditPage = (
    transferId
  ) => {
    localStorage.setItem(
      "selectedStockTransfer",
      transferId
    );

    localStorage.setItem(
      "stockTransferMode",
      "edit"
    );

    setPage(
      "stock-transfer-form"
    );
  };


  const deleteTransfer =
    async (transferId) => {

      const confirmed =
        window.confirm(
          isArabic
            ? "هل أنتِ متأكدة من حذف هذه المسودة؟"
            : "Are you sure you want to delete this draft?"
        );


      if (!confirmed) {
        return;
      }


      try {
        const response =
          await apiFetch(
            `/stock-transfers/${transferId}/`,
            {
              method: "DELETE",
            }
          );


        if (!response.ok) {
          let data = null;

          try {
            data =
              await response.json();
          } catch {
            data = null;
          }


          console.error(
            "Delete transfer error:",
            data
          );


          window.alert(
            isArabic
              ? "تعذر حذف المسودة"
              : "Unable to delete the draft"
          );

          return;
        }


        window.alert(
          isArabic
            ? "تم حذف المسودة بنجاح"
            : "Draft deleted successfully"
        );


        await loadTransfers();

      } catch (error) {
        console.error(
          "Delete transfer error:",
          error
        );


        window.alert(
          isArabic
            ? "حدث خطأ أثناء حذف المسودة"
            : "An error occurred while deleting the draft"
        );
      }
    };


  const escapeHtml = (value) => {
    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };


  const printTransfer =
    async (transferId) => {

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=700"
        );


      if (!printWindow) {
        window.alert(
          isArabic
            ? "تعذر فتح نافذة الطباعة. تأكدي من السماح بالنوافذ المنبثقة."
            : "Unable to open the print window. Please allow pop-ups."
        );

        return;
      }


      printWindow.document.write(
        `
        <html>
          <head>
            <title>
              ${
                isArabic
                  ? "جاري تحميل إيصال النقل..."
                  : "Loading transfer receipt..."
              }
            </title>
          </head>

          <body
            style="
              font-family: Arial, sans-serif;
              padding: 40px;
              text-align: center;
            "
          >
            ${
              isArabic
                ? "جاري تحميل بيانات عملية النقل..."
                : "Loading stock transfer data..."
            }
          </body>
        </html>
        `
      );

      printWindow.document.close();


      try {
        const response =
          await apiFetch(
            `/stock-transfers/${transferId}/`
          );

        const data =
          await response.json();


        if (!response.ok) {
          console.error(
            "Print transfer error:",
            data
          );

          printWindow.close();

          window.alert(
            isArabic
              ? "تعذر تحميل بيانات عملية النقل للطباعة"
              : "Unable to load the stock transfer for printing"
          );

          return;
        }


        const transferDate =
          data.transfer_date
            ? new Date(
                data.transfer_date
              ).toLocaleString(
                isArabic
                  ? "ar"
                  : "en"
              )
            : "-";


        const createdAt =
          data.created_at
            ? new Date(
                data.created_at
              ).toLocaleString(
                isArabic
                  ? "ar"
                  : "en"
              )
            : "-";


        const statusLabel =
          data.status === "completed"
            ? isArabic
              ? "مكتملة"
              : "Completed"
            : isArabic
            ? "مسودة"
            : "Draft";


        const itemsRows =
          (data.items || [])
            .map(
              (item, index) => `
                <tr>
                  <td>${index + 1}</td>

                  <td>
                    ${escapeHtml(
                      item.item_name ||
                      item.item
                    )}
                  </td>

                  <td dir="ltr">
                    ${escapeHtml(
                      item.quantity
                    )}
                  </td>
                </tr>
              `
            )
            .join("");


        const title =
          isArabic
            ? "إيصال نقل مخزون"
            : "Stock Transfer Receipt";


        const html = `
          <!DOCTYPE html>

          <html
            lang="${
              isArabic
                ? "ar"
                : "en"
            }"
            dir="${
              isArabic
                ? "rtl"
                : "ltr"
            }"
          >

            <head>

              <meta charset="UTF-8" />

              <title>
                ${title} #${escapeHtml(data.id)}
              </title>


              <style>

                * {
                  box-sizing: border-box;
                }


                body {
                  margin: 0;
                  padding: 30px;
                  font-family: Arial, sans-serif;
                  color: #222;
                  background: white;
                }


                .receipt {
                  width: 100%;
                  max-width: 850px;
                  margin: 0 auto;
                }


                .header {
                  text-align: center;
                  border-bottom: 2px solid #222;
                  padding-bottom: 18px;
                  margin-bottom: 25px;
                }


                .header h1 {
                  margin: 0 0 8px;
                  font-size: 26px;
                }


                .header p {
                  margin: 0;
                  color: #555;
                  font-size: 14px;
                }


                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px 30px;
                  margin-bottom: 25px;
                }


                .info-box {
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  padding: 12px;
                }


                .info-label {
                  display: block;
                  font-size: 12px;
                  color: #777;
                  margin-bottom: 5px;
                }


                .info-value {
                  font-size: 15px;
                  font-weight: bold;
                }


                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                }


                th,
                td {
                  border: 1px solid #ccc;
                  padding: 11px;
                  text-align: center;
                }


                th {
                  background: #f3f3f3;
                  font-weight: bold;
                }


                .notes {
                  margin-top: 25px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  padding: 15px;
                  min-height: 60px;
                }


                .notes-title {
                  font-weight: bold;
                  margin-bottom: 8px;
                }


                .signatures {
                  display: flex;
                  justify-content: space-between;
                  gap: 40px;
                  margin-top: 55px;
                }


                .signature {
                  width: 45%;
                  text-align: center;
                }


                .signature-line {
                  border-top: 1px solid #333;
                  padding-top: 8px;
                  margin-top: 40px;
                }


                .print-actions {
                  text-align: center;
                  margin-top: 30px;
                }


                .print-button {
                  border: none;
                  background: #333;
                  color: white;
                  border-radius: 6px;
                  padding: 10px 25px;
                  cursor: pointer;
                  font-size: 14px;
                }


                @media print {

                  body {
                    padding: 0;
                  }


                  .print-actions {
                    display: none;
                  }


                  .receipt {
                    max-width: none;
                  }
                }


                @page {
                  size: A4;
                  margin: 15mm;
                }

              </style>

            </head>


            <body>

              <div class="receipt">


                <div class="header">

                  <h1>
                    ${title}
                  </h1>

                  <p>
                    ${
                      isArabic
                        ? `رقم العملية: #${escapeHtml(data.id)}`
                        : `Transfer No.: #${escapeHtml(data.id)}`
                    }
                  </p>

                </div>


                <div class="info-grid">


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "المستودع المصدر"
                          : "Source Warehouse"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        data.from_warehouse_name ||
                        data.from_warehouse
                      )}
                    </span>

                  </div>


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "المستودع الهدف"
                          : "Destination Warehouse"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        data.to_warehouse_name ||
                        data.to_warehouse
                      )}
                    </span>

                  </div>


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "تاريخ النقل"
                          : "Transfer Date"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        transferDate
                      )}
                    </span>

                  </div>


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "الحالة"
                          : "Status"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        statusLabel
                      )}
                    </span>

                  </div>


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "أنشأها"
                          : "Created By"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        data.created_by_name ||
                        "-"
                      )}
                    </span>

                  </div>


                  <div class="info-box">

                    <span class="info-label">
                      ${
                        isArabic
                          ? "تاريخ الإنشاء"
                          : "Created At"
                      }
                    </span>

                    <span class="info-value">
                      ${escapeHtml(
                        createdAt
                      )}
                    </span>

                  </div>


                </div>


                <table>

                  <thead>

                    <tr>

                      <th>
                        #
                      </th>

                      <th>
                        ${
                          isArabic
                            ? "المادة"
                            : "Item"
                        }
                      </th>

                      <th>
                        ${
                          isArabic
                            ? "الكمية"
                            : "Quantity"
                        }
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    ${
                      itemsRows ||
                      `
                        <tr>
                          <td colspan="3">
                            ${
                              isArabic
                                ? "لا توجد مواد"
                                : "No items"
                            }
                          </td>
                        </tr>
                      `
                    }

                  </tbody>

                </table>


                <div class="notes">

                  <div class="notes-title">
                    ${
                      isArabic
                        ? "الملاحظات"
                        : "Notes"
                    }
                  </div>

                  <div>
                    ${escapeHtml(
                      data.notes || "-"
                    )}
                  </div>

                </div>


                <div class="signatures">

                  <div class="signature">

                    <div class="signature-line">
                      ${
                        isArabic
                          ? "توقيع المستودع المصدر"
                          : "Source Warehouse Signature"
                      }
                    </div>

                  </div>


                  <div class="signature">

                    <div class="signature-line">
                      ${
                        isArabic
                          ? "توقيع المستودع المستلم"
                          : "Receiving Warehouse Signature"
                      }
                    </div>

                  </div>

                </div>


                <div class="print-actions">

                  <button
                    class="print-button"
                    onclick="window.print()"
                  >
                    ${
                      isArabic
                        ? "طباعة"
                        : "Print"
                    }
                  </button>

                </div>


              </div>

            </body>

          </html>
        `;


        printWindow.document.open();

        printWindow.document.write(
          html
        );

        printWindow.document.close();

        printWindow.focus();


        setTimeout(() => {
          printWindow.print();
        }, 400);

      } catch (error) {
        console.error(
          "Print transfer error:",
          error
        );


        printWindow.close();


        window.alert(
          isArabic
            ? "حدث خطأ أثناء تجهيز الإيصال للطباعة"
            : "An error occurred while preparing the receipt"
        );
      }
    };


  const filteredTransfers =
    transfers.filter(
      (transfer) => {

        const searchValue =
          search
            .trim()
            .toLowerCase();


        const matchesSearch =
          searchValue === "" ||

          String(
            transfer.id
          ).includes(
            searchValue
          ) ||

          String(
            transfer.from_warehouse_name ||
            transfer.from_warehouse ||
            ""
          )
            .toLowerCase()
            .includes(
              searchValue
            ) ||

          String(
            transfer.to_warehouse_name ||
            transfer.to_warehouse ||
            ""
          )
            .toLowerCase()
            .includes(
              searchValue
            ) ||

          String(
            transfer.created_by_name ||
            ""
          )
            .toLowerCase()
            .includes(
              searchValue
            );


        const matchesStatus =
          selectedStatus === "all" ||
          transfer.status ===
            selectedStatus;


        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );


  const totalPages =
    Math.ceil(
      filteredTransfers.length /
      itemsPerPage
    ) || 1;


  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );


  const startIndex =
    (safeCurrentPage - 1) *
    itemsPerPage;


  const currentTransfers =
    filteredTransfers.slice(
      startIndex,
      startIndex + itemsPerPage
    );


  return (
    <>
      <div className="page-header">

        <div>

          <h1 className="page-title">
            {t(
              "stock_transfers_title"
            )}
          </h1>


          <p className="page-subtitle">
            {t(
              "manage_stock_transfers"
            )}
          </p>

        </div>


        <button
          className="add-btn"
          type="button"
          onClick={
            openCreatePage
          }
        >
          {t(
            "add_stock_transfer"
          )}
        </button>

      </div>


      <div className="table-header">

        <div className="search-box">

          <input
            type="text"
            placeholder={t(
              "search_stock_transfers"
            )}
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );

              setCurrentPage(1);
            }}
          />

        </div>


        <div className="filter-buttons">

          <button
            type="button"
            className={
              selectedStatus === "all"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() => {
              setSelectedStatus(
                "all"
              );

              setCurrentPage(1);
            }}
          >
            {t("all")}
          </button>


          <button
            type="button"
            className={
              selectedStatus === "draft"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() => {
              setSelectedStatus(
                "draft"
              );

              setCurrentPage(1);
            }}
          >
            {t("draft")}
          </button>


          <button
            type="button"
            className={
              selectedStatus === "completed"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() => {
              setSelectedStatus(
                "completed"
              );

              setCurrentPage(1);
            }}
          >
            {t("completed")}
          </button>

        </div>

      </div>


      <div className="card table-wrapper">

        {loading ? (

          <p>
            {t(
              "loading_stock_transfers"
            )}
          </p>

        ) : (

          <table>

            <thead>

              <tr>

                <th>
                  {t(
                    "transfer_number"
                  )}
                </th>


                <th>
                  {t(
                    "source_warehouse"
                  )}
                </th>


                <th>
                  {t(
                    "destination_warehouse"
                  )}
                </th>


                <th>
                  {t("date")}
                </th>


                <th>
                  {t("status")}
                </th>


                <th>
                  {t("user")}
                </th>


                <th>
                  {t("actions")}
                </th>

              </tr>

            </thead>


            <tbody>

              {currentTransfers.length ===
              0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign:
                        "center",
                    }}
                  >
                    {t(
                      "no_stock_transfers"
                    )}
                  </td>

                </tr>

              ) : (

                currentTransfers.map(
                  (transfer) => (

                    <tr
                      key={
                        transfer.id
                      }
                    >

                      <td>
                        #{transfer.id}
                      </td>


                      <td>
                        {
                          transfer.from_warehouse_name ||
                          transfer.from_warehouse
                        }
                      </td>


                      <td>
                        {
                          transfer.to_warehouse_name ||
                          transfer.to_warehouse
                        }
                      </td>


                      <td>
                        {transfer.transfer_date
                          ? new Date(
                              transfer.transfer_date
                            ).toLocaleDateString(
                              isArabic
                                ? "ar"
                                : "en"
                            )
                          : "-"}
                      </td>


                      <td>
                        {transfer.status ===
                        "draft"
                          ? t("draft")
                          : t(
                              "completed"
                            )}
                      </td>


                      <td>
                        {
                          transfer.created_by_name ||
                          "-"
                        }
                      </td>


                      <td>

                        <div className="actions-group">

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              openViewPage(
                                transfer.id
                              )
                            }
                          >
                            {t("view")}
                          </button>


                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              printTransfer(
                                transfer.id
                              )
                            }
                          >
                            {isArabic
                              ? "طباعة"
                              : "Print"}
                          </button>


                          {transfer.status ===
                            "draft" && (
                            <>

                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() =>
                                  openEditPage(
                                    transfer.id
                                  )
                                }
                              >
                                {t("edit")}
                              </button>


                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() =>
                                  deleteTransfer(
                                    transfer.id
                                  )
                                }
                              >
                                {t(
                                  "delete"
                                )}
                              </button>

                            </>
                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        )}


        {!loading && (

          <div className="pagination">

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      page - 1,
                      1
                    )
                )
              }
              disabled={
                safeCurrentPage === 1
              }
            >
              {t("previous")}
            </button>


            <span>
              {t("page")}{" "}
              {safeCurrentPage}{" "}
              {t("of")}{" "}
              {totalPages}
            </span>


            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      page + 1,
                      totalPages
                    )
                )
              }
              disabled={
                safeCurrentPage >=
                totalPages
              }
            >
              {t("next")}
            </button>

          </div>

        )}

      </div>
    </>
  );
}


export default StockTransfersPage;