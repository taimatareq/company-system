function getExchangeRateValue() {
    const exchangeSelect = document.getElementById("id_exchange_rate");
    if (!exchangeSelect) return 0;

    const selectedText = exchangeSelect.options[exchangeSelect.selectedIndex]?.text || "";
    const numbers = selectedText.match(/\d+(\.\d+)?/g);

    if (!numbers || numbers.length === 0) return 0;

    return parseFloat(numbers[numbers.length - 1]) || 0;
}

function setHeaderTotal(fieldName, value) {
    const row = document.querySelector(".field-" + fieldName);
    if (!row) return;

    const readonly = row.querySelector(".readonly");
    if (readonly) readonly.textContent = value;
}

function setLineValue(row, fieldClass, value) {
    const cell = row.querySelector(fieldClass);
    if (!cell) return;

    cell.innerHTML = "";

    const box = document.createElement("span");
    box.className = "live-value";
    box.style.fontWeight = "bold";
    box.textContent = value;

    cell.appendChild(box);
}
// function calculateSalesTotals() {
//     const hasEditableInputs = document.querySelector(
//         "tr.form-row input[name$='quantity'], tr.form-row input[name$='unit_price_usd']"
//     );

//     if (!hasEditableInputs) {
//         return;
//     }

//     const rate = getExchangeRateValue();

//     let totalUSD = 0;
//     let totalSYP = 0;
//     document.querySelectorAll("tr.form-row").forEach(function (row) {
//         if (row.classList.contains("empty-form")) return;

//         const qtyInput = row.querySelector("input[name$='quantity']");
//         const usdInput = row.querySelector("input[name$='unit_price_usd']");

//         if (!qtyInput || !usdInput) return;

//         const qty = parseFloat(qtyInput.value) || 0;
//         const usd = parseFloat(usdInput.value) || 0;

//         const unitSYP = usd * rate;
//         const lineTotalUSD = qty * usd;
//         const lineTotalSYP = qty * unitSYP;

//         setLineValue(row, ".field-unit_price_syp", unitSYP.toFixed(2));
//         setLineValue(row, ".field-line_total_usd_display", lineTotalUSD.toFixed(2));
//         setLineValue(row, ".field-line_total_syp_display", lineTotalSYP.toFixed(2));

//         totalUSD += lineTotalUSD;
//         totalSYP += lineTotalSYP;
//     });

//     setHeaderTotal("total_amount_usd", totalUSD.toFixed(2));
//     setHeaderTotal("total_amount_syp", totalSYP.toFixed(2));
//     setHeaderTotal("total_amount", totalSYP.toFixed(2));
// }
function calculateSalesTotals() {
    const saveButton = document.querySelector('input[name="_apply"]');

    if (!saveButton) {
        return;
    }

    const rate = getExchangeRateValue();

    let totalUSD = 0;
    let totalSYP = 0;

    const editableRows = Array.from(document.querySelectorAll("tr.form-row")).filter(function (row) {
        if (row.classList.contains("empty-form")) return false;

        const qtyInput = row.querySelector("input[name$='quantity']");
        const usdInput = row.querySelector("input[name$='unit_price_usd']");

        return qtyInput && usdInput;
    });

    editableRows.forEach(function (row) {
        const qtyInput = row.querySelector("input[name$='quantity']");
        const usdInput = row.querySelector("input[name$='unit_price_usd']");

        const qty = parseFloat(qtyInput.value) || 0;
        const usd = parseFloat(usdInput.value) || 0;

        const unitSYP = usd * rate;
        const lineTotalUSD = qty * usd;
        const lineTotalSYP = qty * unitSYP;

        setLineValue(row, ".field-unit_price_syp", unitSYP.toFixed(2));
        setLineValue(row, ".field-line_total_usd_display", lineTotalUSD.toFixed(2));
        setLineValue(row, ".field-line_total_syp_display", lineTotalSYP.toFixed(2));

        totalUSD += lineTotalUSD;
        totalSYP += lineTotalSYP;
    });

    setHeaderTotal("total_amount_usd", totalUSD.toFixed(2));
    setHeaderTotal("total_amount_syp", totalSYP.toFixed(2));
    setHeaderTotal("total_amount", totalSYP.toFixed(2));
}
document.addEventListener("DOMContentLoaded", function () {
    console.log("SALES JS LOADED");

    const paymentType = document.getElementById("id_payment_type");
    const dueDateRow = document.querySelector(".form-row.field-due_date");

    function toggleDueDate() {
        if (!paymentType || !dueDateRow) return;
        dueDateRow.style.display = paymentType.value === "credit" ? "flex" : "none";
    }

    toggleDueDate();
    if (paymentType) paymentType.addEventListener("change", toggleDueDate);

    document.addEventListener("input", calculateSalesTotals);
    document.addEventListener("change", calculateSalesTotals);

    document.addEventListener("formset:added", function () {
        setTimeout(calculateSalesTotals, 50);
    });

    const saveButton = document.querySelector('input[name="_apply"]');

    if (saveButton) {
        calculateSalesTotals();
    }
});

document.addEventListener("change", function (e) {
    if (e.target.id !== "id_branch") return;

    const branchId = e.target.value;
    const warehouseSelect = document.getElementById("id_warehouse");

    if (!warehouseSelect) return;

    warehouseSelect.innerHTML = '<option value="">---------</option>';

    if (!branchId) return;

    fetch(`/api/warehouses/by-branch/?branch=${branchId}`)
        .then(response => response.json())
        .then(data => {
            data.forEach(function (warehouse) {
                const option = document.createElement("option");
                option.value = warehouse.id;
                option.textContent = warehouse.name;
                warehouseSelect.appendChild(option);
            });
        });
});

document.addEventListener("change", function (e) {
    if (!e.target.name || !e.target.name.endsWith("-item")) return;

    const row = e.target.closest("tr");
    const itemId = e.target.value;

    if (!row || !itemId) return;

    fetch(`/api/items/price/?item=${itemId}`)
        .then(response => response.json())
        .then(data => {
            const priceInput = row.querySelector("input[name$='unit_price_usd']");

            if (priceInput) {
                priceInput.value = parseFloat(data.retail_price || 0).toFixed(2);
                setTimeout(calculateSalesTotals, 50);
            }
        });
});