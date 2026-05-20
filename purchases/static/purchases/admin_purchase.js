function setReadonlyValue(fieldName, value) {
    const row = document.querySelector(".field-" + fieldName);
    if (!row) return;

    const readonly = row.querySelector(".readonly");
    if (readonly) {
        readonly.textContent = value;
    }
}

function getExchangeRateValue() {
    const exchangeSelect = document.getElementById("id_exchange_rate");
    if (!exchangeSelect) return 0;

    const selectedText = exchangeSelect.options[exchangeSelect.selectedIndex]?.text || "";
    const numbers = selectedText.match(/\d+(\.\d+)?/g);

    if (!numbers || numbers.length === 0) return 0;

    return parseFloat(numbers[numbers.length - 1]) || 0;
}

function calculatePurchaseTotals() {
    const rate = getExchangeRateValue();

    let totalUSD = 0;
    let totalSYP = 0;

    document.querySelectorAll("tr.form-row").forEach(function (row) {
        const qtyInput = row.querySelector("input[name*='quantity']");
        const usdInput = row.querySelector("input[name*='unit_cost_usd']");

        if (!qtyInput || !usdInput) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const usd = parseFloat(usdInput.value) || 0;

        const unitSYP = usd * rate;

        const sypCell = row.querySelector(".field-unit_cost_syp");
        if (sypCell) {
            const readonly = sypCell.querySelector(".readonly");
            if (readonly) {
                readonly.textContent = unitSYP.toFixed(2);
            } else {
                sypCell.textContent = unitSYP.toFixed(2);
            }
        }

        totalUSD += qty * usd;
        totalSYP += qty * unitSYP;
    });

    setReadonlyValue("total_amount_usd", totalUSD.toFixed(2));
    setReadonlyValue("total_amount_syp", totalSYP.toFixed(2));
    setReadonlyValue("total_amount", totalSYP.toFixed(2));
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("PURCHASE JS LOADED");

    const paymentType = document.getElementById("id_payment_type");
    const dueDateRow = document.querySelector(".form-row.field-due_date");

    function toggleDueDate() {
        if (!paymentType || !dueDateRow) return;
        dueDateRow.style.display = paymentType.value === "credit" ? "flex" : "none";
    }

    toggleDueDate();

    if (paymentType) {
        paymentType.addEventListener("change", toggleDueDate);
    }

    document.addEventListener("input", calculatePurchaseTotals);
    document.addEventListener("change", calculatePurchaseTotals);

    calculatePurchaseTotals();
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

// document.addEventListener("change", function (e) {
//     if (!e.target.name || !e.target.name.endsWith("-item")) return;

//     const row = e.target.closest("tr");
//     const itemId = e.target.value;

//     if (!row || !itemId) return;

//     fetch(`/api/items/purchase-price/?item=${itemId}`)
//         .then(response => response.json())
//         .then(data => {
//             const costInput = row.querySelector("input[name*='unit_cost_usd']");
//             if (costInput) {
//                 costInput.value = parseFloat(data.price || 0).toFixed(2);

//                 costInput.dispatchEvent(new Event("input", { bubbles: true }));

//                 if (typeof calculatePurchaseTotals === "function") {
//                     setTimeout(calculatePurchaseTotals, 50);
//                 }
//             }
//         });
// });
document.addEventListener("change", function (e) {
    if (!e.target.name || !e.target.name.includes("-item")) return;

    const row = e.target.closest("tr");
    const itemId = e.target.value;

    if (!row || !itemId) return;

    fetch(`/api/items/purchase-price/?item=${itemId}`)
        .then(response => response.json())
        .then(data => {
            const costInput = row.querySelector("input[name*='unit_cost_usd']");

            if (costInput) {
                costInput.value = parseFloat(data.price || 0).toFixed(2);
                costInput.dispatchEvent(new Event("input", { bubbles: true }));
                calculatePurchaseTotals();
            }
        });
});