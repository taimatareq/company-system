import { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Barcode from "react-barcode";

function ItemsTable({ items, onDelete, onEdit }) {
  const { t } = useTranslation();
  const [barcodeItem, setBarcodeItem] = useState(null);

  const printBarcode = () => {
  const printContents =
    document.querySelector(".barcode-print-area").innerHTML;

  const printWindow = window.open("", "", "width=800,height=700");

  printWindow.document.write(`
    <html>
      <head>
        <title>Barcode</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            text-align: center;
            font-family: Arial, sans-serif;
          }

          button {
            display: none;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <h3>{t("no_items_found")}</h3>
        <p>{t("try_changing_filters")}</p>
      </div>
    );
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{t("name")}</th>
            <th>{t("item_type")}</th>
            <th>{t("retail_price")}</th>
            <th>{t("retail_tax")}</th>
            <th>{t("wholesale_price")}</th>
            <th>{t("wholesale_tax")}</th>
            <th>{t("action")}</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>

              <td>
                {item.item_type === "service"
                  ? t("service")
                  : t("product")}
              </td>

              <td>${Number(item.retail_price || 0).toFixed(2)}</td>
              <td>{Number(item.retail_tax_rate || 0).toFixed(2)}%</td>
              <td>${Number(item.wholesale_price || 0).toFixed(2)}</td>
              <td>{Number(item.wholesale_tax_rate || 0).toFixed(2)}%</td>

              <td>
                <div className="actions-group">
                  <button
                    className="edit-btn"
                    onClick={() => onEdit(item)}
                    title={t("edit")}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => onDelete(item.id)}
                    title={t("delete")}
                  >
                    <FaTrash />
                  </button>

                  <button
                    className="secondary-btn"
                    onClick={() => setBarcodeItem(item)}
                  >
                    {t("print_barcode")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {barcodeItem && (
  <div className="modal-overlay">
    <div className="modal-content barcode-print-area">
      <h3>{barcodeItem.name}</h3>

      <Barcode
  value={String(barcodeItem.id).padStart(6, "0")}
  width={3}
  height={90}
  fontSize={18}
  margin={10}
/>

      <p>
        {String(barcodeItem.id).padStart(6, "0")}
      </p>

            <div className="modal-actions no-print">
              <button
                className="modal-btn secondary"
                onClick={() => setBarcodeItem(null)}
              >
                {t("cancel")}
              </button>

              <button
                className="modal-btn primary"
                onClick={printBarcode}
              >
                {t("print")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ItemsTable;