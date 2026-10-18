import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { apiFetch } from "../api";


function StockTransferFormPage({ setPage }) {
  const { i18n } = useTranslation();

  const isArabic =
    i18n.language?.startsWith("ar");


  const text = {
    titleCreate: isArabic
      ? "إضافة عملية نقل"
      : "Add Stock Transfer",

    titleEdit: isArabic
      ? "تعديل عملية النقل"
      : "Edit Stock Transfer",

    titleView: isArabic
      ? "تفاصيل عملية النقل"
      : "Stock Transfer Details",

    subtitle: isArabic
      ? "نقل المواد بين المستودعات"
      : "Transfer items between warehouses",

    back: isArabic
      ? "رجوع"
      : "Back",

    sourceWarehouse: isArabic
      ? "المستودع المصدر"
      : "Source Warehouse",

    destinationWarehouse: isArabic
      ? "المستودع الهدف"
      : "Destination Warehouse",

    selectSource: isArabic
      ? "اختاري المستودع المصدر"
      : "Select source warehouse",

    selectDestination: isArabic
      ? "اختاري المستودع الهدف"
      : "Select destination warehouse",

    transferDate: isArabic
      ? "تاريخ النقل"
      : "Transfer Date",

    status: isArabic
      ? "الحالة"
      : "Status",

    draft: isArabic
      ? "مسودة"
      : "Draft",

    completed: isArabic
      ? "مكتملة"
      : "Completed",

    notes: isArabic
      ? "الملاحظات"
      : "Notes",

    optionalNotes: isArabic
      ? "ملاحظات اختيارية"
      : "Optional notes",

    item: isArabic
      ? "المادة"
      : "Item",

    currentStock: isArabic
      ? "الرصيد الحالي"
      : "Current Stock",

    requestedQuantity: isArabic
      ? "الكمية المطلوبة"
      : "Requested Quantity",

    delete: isArabic
      ? "حذف"
      : "Delete",

    selectItem: isArabic
      ? "اختاري المادة"
      : "Select item",

    addItem: isArabic
      ? "إضافة مادة"
      : "Add Item",

    saveDraft: isArabic
      ? "حفظ كمسودة"
      : "Save as Draft",

    execute: isArabic
      ? "تنفيذ العملية"
      : "Execute / Complete",

    saving: isArabic
      ? "جاري الحفظ..."
      : "Saving...",

    executing: isArabic
      ? "جاري التنفيذ..."
      : "Executing...",

    loading: isArabic
      ? "جاري تحميل البيانات..."
      : "Loading data...",

    quantityTooHigh: isArabic
      ? "الكمية المطلوبة أكبر من الرصيد المتوفر"
      : "Requested quantity exceeds available stock",

    duplicateItem: isArabic
      ? "المادة مضافة مسبقاً"
      : "This item has already been added",

    sourceRequired: isArabic
      ? "اختاري المستودع المصدر"
      : "Please select the source warehouse",

    destinationRequired: isArabic
      ? "اختاري المستودع الهدف"
      : "Please select the destination warehouse",

    sameWarehouse: isArabic
      ? "المستودع المصدر والهدف لا يمكن أن يكونا نفس المستودع"
      : "Source and destination warehouses cannot be the same",

    dateRequired: isArabic
      ? "اختاري تاريخ النقل"
      : "Please select the transfer date",

    itemsRequired: isArabic
      ? "تأكدي من اختيار المواد والكميات"
      : "Please select all items and enter valid quantities",

    loadError: isArabic
      ? "حدث خطأ أثناء تحميل البيانات"
      : "An error occurred while loading data",

    loadTransferError: isArabic
      ? "تعذر تحميل عملية النقل"
      : "Unable to load the stock transfer",

    createFailed: isArabic
      ? "فشل إنشاء عملية النقل"
      : "Failed to create the stock transfer",

    createError: isArabic
      ? "حدث خطأ أثناء إنشاء العملية"
      : "An error occurred while creating the stock transfer",

    savedDraft: isArabic
      ? "تم حفظ العملية كمسودة"
      : "Stock transfer saved as Draft",

    executed: isArabic
      ? "تم تنفيذ عملية النقل بنجاح"
      : "Stock transfer completed successfully",

    updateFailed: isArabic
      ? "فشل تعديل العملية"
      : "Failed to update the stock transfer",

    updateError: isArabic
      ? "حدث خطأ أثناء تعديل العملية"
      : "An error occurred while updating the stock transfer",

    updated: isArabic
      ? "تم تعديل العملية بنجاح"
      : "Stock transfer updated successfully",

    executeFailed: isArabic
      ? "فشل تنفيذ عملية النقل"
      : "Failed to execute the stock transfer",

    executeError: isArabic
      ? "حدث خطأ أثناء تنفيذ العملية"
      : "An error occurred while executing the stock transfer",
  };


  const mode =
    localStorage.getItem("stockTransferMode") ||
    "create";


  const transferId =
    localStorage.getItem(
      "selectedStockTransfer"
    );


  const isViewMode =
    mode === "view";

  const isEditMode =
    mode === "edit";


  const getCurrentDateTime = () => {
    const now = new Date();

    now.setMinutes(
      now.getMinutes() -
        now.getTimezoneOffset()
    );

    return now
      .toISOString()
      .slice(0, 16);
  };


  const formatDateForInput = (value) => {
    if (!value) {
      return getCurrentDateTime();
    }

    const date =
      new Date(value);

    date.setMinutes(
      date.getMinutes() -
        date.getTimezoneOffset()
    );

    return date
      .toISOString()
      .slice(0, 16);
  };


  const [warehouses, setWarehouses] =
    useState([]);

  const [items, setItems] =
    useState([]);

  const [fromWarehouse, setFromWarehouse] =
    useState("");

  const [toWarehouse, setToWarehouse] =
    useState("");

  const [transferDate, setTransferDate] =
    useState(
      getCurrentDateTime()
    );

  const [notes, setNotes] =
    useState("");

  const [status, setStatus] =
    useState("draft");

  const [transferItems, setTransferItems] =
    useState([
      {
        item: "",
        quantity: "",
        stock: null,
      },
    ]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {
    loadBasicData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const loadBasicData = async () => {
    try {
      setLoading(true);


      const [
        warehousesResponse,
        itemsResponse,
      ] = await Promise.all([
        apiFetch("/warehouses/"),
        apiFetch("/items/"),
      ]);


      const warehousesData =
        await warehousesResponse.json();

      const itemsData =
        await itemsResponse.json();


      if (!warehousesResponse.ok) {
        console.error(
          "Warehouses error:",
          warehousesData
        );

        setWarehouses([]);

      } else {
        const warehousesList =
          Array.isArray(
            warehousesData
          )
            ? warehousesData
            : warehousesData.results ||
              warehousesData.warehouses ||
              warehousesData.data ||
              [];


        setWarehouses(
          warehousesList
        );
      }


      if (!itemsResponse.ok) {
        console.error(
          "Items error:",
          itemsData
        );

        setItems([]);

      } else {
        const itemsList =
          Array.isArray(
            itemsData
          )
            ? itemsData
            : itemsData.results ||
              itemsData.items ||
              itemsData.data ||
              [];


        setItems(
          itemsList.filter(
            (item) =>
              item.item_type ===
              "product"
          )
        );
      }


      if (
        (isEditMode ||
          isViewMode) &&
        transferId
      ) {
        await loadTransfer(
          transferId
        );
      }

    } catch (error) {
      console.error(error);

      toast.error(
        text.loadError
      );

    } finally {
      setLoading(false);
    }
  };


  const loadTransfer = async (id) => {
    try {
      const response =
        await apiFetch(
          `/stock-transfers/${id}/`
        );


      const data =
        await response.json();


      if (!response.ok) {
        console.error(data);

        toast.error(
          text.loadTransferError
        );

        return;
      }


      setFromWarehouse(
        String(
          data.from_warehouse
        )
      );


      setToWarehouse(
        String(
          data.to_warehouse
        )
      );


      setTransferDate(
        formatDateForInput(
          data.transfer_date
        )
      );


      setNotes(
        data.notes || ""
      );


      setStatus(
        data.status
      );


      const loadedItems =
        (data.items || []).map(
          (row) => ({
            item:
              String(
                row.item
              ),

            quantity:
              row.quantity,

            stock: null,
          })
        );


      if (
        loadedItems.length === 0
      ) {
        setTransferItems([
          {
            item: "",
            quantity: "",
            stock: null,
          },
        ]);

        return;
      }


      if (
        data.from_warehouse
      ) {
        const itemsWithStock =
          await Promise.all(
            loadedItems.map(
              async (row) => {

                const stock =
                  await getItemStock(
                    data.from_warehouse,
                    row.item
                  );


                return {
                  ...row,
                  stock,
                };
              }
            )
          );


        setTransferItems(
          itemsWithStock
        );

      } else {
        setTransferItems(
          loadedItems
        );
      }

    } catch (error) {
      console.error(error);

      toast.error(
        text.loadTransferError
      );
    }
  };


  const getItemStock = async (
    warehouseId,
    itemId
  ) => {

    if (
      !warehouseId ||
      !itemId
    ) {
      return null;
    }


    try {
      const response =
        await apiFetch(
          `/inventory/item-stock/?warehouse=${warehouseId}&item=${itemId}`
        );


      const data =
        await response.json();


      if (!response.ok) {
        console.error(
          "Stock error:",
          data
        );

        return 0;
      }


      if (
        data.stock !== undefined
      ) {
        return Number(
          data.stock
        );
      }


      if (
        data.quantity !== undefined
      ) {
        return Number(
          data.quantity
        );
      }


      if (
        data.current_quantity !==
        undefined
      ) {
        return Number(
          data.current_quantity
        );
      }


      return 0;

    } catch (error) {
      console.error(error);

      return 0;
    }
  };


  const handleFromWarehouseChange =
    async (value) => {

      setFromWarehouse(
        value
      );


      if (
        value &&
        value === toWarehouse
      ) {
        setToWarehouse("");
      }


      const updatedItems =
        await Promise.all(
          transferItems.map(
            async (row) => {

              if (!row.item) {
                return {
                  ...row,
                  stock: null,
                };
              }


              const stock =
                await getItemStock(
                  value,
                  row.item
                );


              return {
                ...row,
                stock,
              };
            }
          )
        );


      setTransferItems(
        updatedItems
      );
    };


  const handleItemChange =
    async (
      index,
      value
    ) => {

      const duplicate =
        transferItems.some(
          (
            row,
            rowIndex
          ) =>
            rowIndex !== index &&
            row.item === value &&
            value !== ""
        );


      if (duplicate) {
        toast.error(
          text.duplicateItem
        );

        return;
      }


      const updatedItems =
        [...transferItems];


      updatedItems[index] = {
        ...updatedItems[index],

        item: value,

        stock: null,
      };


      setTransferItems(
        updatedItems
      );


      if (
        value &&
        fromWarehouse
      ) {
        const stock =
          await getItemStock(
            fromWarehouse,
            value
          );


        const itemsCopy =
          [...updatedItems];


        itemsCopy[index] = {
          ...itemsCopy[index],
          stock,
        };


        setTransferItems(
          itemsCopy
        );
      }
    };


  const handleQuantityChange =
    (
      index,
      value
    ) => {

      const updatedItems =
        [...transferItems];


      updatedItems[index] = {
        ...updatedItems[index],

        quantity:
          value,
      };


      setTransferItems(
        updatedItems
      );
    };


  const addItemRow = () => {
    setTransferItems([
      ...transferItems,

      {
        item: "",
        quantity: "",
        stock: null,
      },
    ]);
  };


  const removeItemRow =
    (index) => {

      if (
        transferItems.length === 1
      ) {
        setTransferItems([
          {
            item: "",
            quantity: "",
            stock: null,
          },
        ]);

        return;
      }


      setTransferItems(
        transferItems.filter(
          (
            _,
            rowIndex
          ) =>
            rowIndex !==
            index
        )
      );
    };


  const handleBack = () => {
    localStorage.removeItem(
      "selectedStockTransfer"
    );

    localStorage.removeItem(
      "stockTransferMode"
    );

    setPage(
      "stock-transfers"
    );
  };


  const validateForm =
    (execute = false) => {

      if (
        !fromWarehouse
      ) {
        toast.error(
          text.sourceRequired
        );

        return false;
      }


      if (
        !toWarehouse
      ) {
        toast.error(
          text.destinationRequired
        );

        return false;
      }


      if (
        fromWarehouse ===
        toWarehouse
      ) {
        toast.error(
          text.sameWarehouse
        );

        return false;
      }


      if (
        !transferDate
      ) {
        toast.error(
          text.dateRequired
        );

        return false;
      }


      const invalidItem =
        transferItems.find(
          (row) =>
            !row.item ||
            Number(
              row.quantity
            ) <= 0
        );


      if (invalidItem) {
        toast.error(
          text.itemsRequired
        );

        return false;
      }


      if (execute) {
        const insufficientStock =
          transferItems.find(
            (row) =>
              row.stock !== null &&
              Number(
                row.quantity
              ) >
                Number(
                  row.stock
                )
          );


        if (
          insufficientStock
        ) {
          toast.error(
            text.quantityTooHigh
          );

          return false;
        }
      }


      return true;
    };


  const buildPayload = () => {
    return {
      from_warehouse:
        Number(
          fromWarehouse
        ),

      to_warehouse:
        Number(
          toWarehouse
        ),

      transfer_date:
        new Date(
          transferDate
        ).toISOString(),

      notes:
        notes || null,

      items:
        transferItems.map(
          (row) => ({
            item:
              Number(
                row.item
              ),

            quantity:
              Number(
                row.quantity
              ),
          })
        ),
    };
  };


  const createTransfer =
    async (
      executeImmediately
    ) => {

      if (
        !validateForm(
          executeImmediately
        )
      ) {
        return;
      }


      try {
        setSaving(true);


        const payload = {
          ...buildPayload(),

          execute:
            executeImmediately,
        };


        const response =
          await apiFetch(
            "/stock-transfers/",
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {
          console.error(data);

          toast.error(
            text.createFailed
          );

          return;
        }


        if (
          executeImmediately
        ) {
          toast.success(
            text.executed
          );

        } else {
          toast.success(
            text.savedDraft
          );
        }


        handleBack();

      } catch (error) {
        console.error(error);

        toast.error(
          text.createError
        );

      } finally {
        setSaving(false);
      }
    };


  const updateDraft =
    async () => {

      if (
        !validateForm(false)
      ) {
        return false;
      }


      try {
        setSaving(true);


        const response =
          await apiFetch(
            `/stock-transfers/${transferId}/`,
            {
              method: "PATCH",

              body:
                JSON.stringify(
                  buildPayload()
                ),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {
          console.error(data);

          toast.error(
            text.updateFailed
          );

          return false;
        }


        toast.success(
          text.updated
        );


        return true;

      } catch (error) {
        console.error(error);

        toast.error(
          text.updateError
        );

        return false;

      } finally {
        setSaving(false);
      }
    };


  const saveDraft =
    async () => {

      if (
        isEditMode
      ) {
        const success =
          await updateDraft();


        if (success) {
          handleBack();
        }


        return;
      }


      await createTransfer(
        false
      );
    };


  const executeTransfer =
    async () => {

      if (
        !validateForm(true)
      ) {
        return;
      }


      if (
        !isEditMode
      ) {
        await createTransfer(
          true
        );

        return;
      }


      const updated =
        await updateDraft();


      if (!updated) {
        return;
      }


      try {
        setSaving(true);


        const response =
          await apiFetch(
            `/stock-transfers/${transferId}/execute/`,
            {
              method: "POST",
            }
          );


        const data =
          await response.json();


        if (
          !response.ok
        ) {
          console.error(data);

          toast.error(
            text.executeFailed
          );

          return;
        }


        toast.success(
          text.executed
        );


        handleBack();

      } catch (error) {
        console.error(error);

        toast.error(
          text.executeError
        );

      } finally {
        setSaving(false);
      }
    };


  if (loading) {
    return (
      <p>
        {text.loading}
      </p>
    );
  }


  return (
    <>
      <div className="page-header">

        <div>

          <h1 className="page-title">
            {isViewMode
              ? text.titleView
              : isEditMode
              ? text.titleEdit
              : text.titleCreate}
          </h1>


          <p className="page-subtitle">
            {text.subtitle}
          </p>

        </div>


        <button
          className="cancel-btn"
          type="button"
          onClick={
            handleBack
          }
        >
          {text.back}
        </button>

      </div>


      <div className="card">

        <div className="form-grid">

          <div className="form-group">

            <label>
              {
                text.sourceWarehouse
              }
            </label>


            <select
              value={
                fromWarehouse
              }
              disabled={
                isViewMode
              }
              onChange={(e) =>
                handleFromWarehouseChange(
                  e.target.value
                )
              }
            >

              <option value="">
                {
                  text.selectSource
                }
              </option>


              {warehouses.map(
                (warehouse) => (

                  <option
                    key={
                      warehouse.id
                    }
                    value={
                      warehouse.id
                    }
                  >
                    {
                      warehouse.name
                    }
                  </option>

                )
              )}

            </select>

          </div>


          <div className="form-group">

            <label>
              {
                text.destinationWarehouse
              }
            </label>


            <select
              value={
                toWarehouse
              }
              disabled={
                isViewMode
              }
              onChange={(e) =>
                setToWarehouse(
                  e.target.value
                )
              }
            >

              <option value="">
                {
                  text.selectDestination
                }
              </option>


              {warehouses
                .filter(
                  (warehouse) =>
                    String(
                      warehouse.id
                    ) !==
                    String(
                      fromWarehouse
                    )
                )
                .map(
                  (warehouse) => (

                    <option
                      key={
                        warehouse.id
                      }
                      value={
                        warehouse.id
                      }
                    >
                      {
                        warehouse.name
                      }
                    </option>

                  )
                )}

            </select>

          </div>


          <div className="form-group">

            <label>
              {
                text.transferDate
              }
            </label>


            <input
              type="datetime-local"
              dir="ltr"
              value={
                transferDate
              }
              disabled={
                isViewMode
              }
              onChange={(e) =>
                setTransferDate(
                  e.target.value
                )
              }
            />

          </div>


          <div className="form-group">

            <label>
              {text.status}
            </label>


            <input
              type="text"
              value={
                status ===
                "completed"
                  ? text.completed
                  : text.draft
              }
              disabled
            />

          </div>


          <div className="form-group">

            <label>
              {text.notes}
            </label>


            <input
              type="text"
              value={
                notes
              }
              disabled={
                isViewMode
              }
              placeholder={
                text.optionalNotes
              }
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
            />

          </div>

        </div>


        <div
          className="table-wrapper"
          style={{
            marginTop:
              "30px",
          }}
        >

          <table>

            <thead>

              <tr>

                <th>
                  {text.item}
                </th>

                <th>
                  {
                    text.currentStock
                  }
                </th>

                <th>
                  {
                    text.requestedQuantity
                  }
                </th>

                {!isViewMode && (
                  <th>
                    {
                      text.delete
                    }
                  </th>
                )}

              </tr>

            </thead>


            <tbody>

              {transferItems.map(
                (
                  row,
                  index
                ) => {

                  const quantityTooHigh =
                    row.stock !== null &&
                    row.quantity !== "" &&
                    Number(
                      row.quantity
                    ) >
                      Number(
                        row.stock
                      );


                  return (
                    <tr
                      key={
                        index
                      }
                    >

                      <td>

                        <select
                          value={
                            row.item
                          }
                          disabled={
                            isViewMode
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            {
                              text.selectItem
                            }
                          </option>


                          {items.map(
                            (item) => (

                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.name
                                }
                              </option>

                            )
                          )}

                        </select>

                      </td>


                      <td>
                        {row.stock ===
                        null
                          ? "-"
                          : row.stock}
                      </td>


                      <td>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          dir="ltr"
                          value={
                            row.quantity
                          }
                          disabled={
                            isViewMode
                          }
                          onChange={(e) =>
                            handleQuantityChange(
                              index,
                              e.target.value
                            )
                          }
                        />


                        {quantityTooHigh && (

                          <div
                            style={{
                              marginTop:
                                "6px",

                              color:
                                "#d32f2f",

                              fontSize:
                                "12px",
                            }}
                          >
                            {
                              text.quantityTooHigh
                            }
                          </div>

                        )}

                      </td>


                      {!isViewMode && (

                        <td>

                          <button
                            className="delete-btn"
                            type="button"
                            onClick={() =>
                              removeItemRow(
                                index
                              )
                            }
                          >
                            {
                              text.delete
                            }
                          </button>

                        </td>

                      )}

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>


        {!isViewMode && (

          <div
            style={{
              marginTop:
                "20px",
            }}
          >

            <button
              className="add-btn"
              type="button"
              onClick={
                addItemRow
              }
            >
              {
                text.addItem
              }
            </button>

          </div>

        )}


        {!isViewMode &&
          status ===
            "draft" && (

          <div
            className="form-actions"
            style={{
              display:
                "flex",

              gap:
                "12px",

              marginTop:
                "30px",
            }}
          >

            <button
              className="save-btn"
              type="button"
              disabled={
                saving
              }
              onClick={
                saveDraft
              }
            >
              {saving
                ? text.saving
                : text.saveDraft}
            </button>


            <button
              className="add-btn"
              type="button"
              disabled={
                saving
              }
              onClick={
                executeTransfer
              }
            >
              {saving
                ? text.executing
                : text.execute}
            </button>

          </div>

        )}

      </div>
    </>
  );
}


export default StockTransferFormPage;