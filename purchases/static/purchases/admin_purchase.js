function setReadonlyValue(fieldName, value) {
    const row = document.querySelector(".field-" + fieldName);
    if (!row) return;

    const readonly = row.querySelector(".readonly");
    if (readonly) {
        readonly.textContent = value;
    }
}

function calculateTotals() {
    const rateInput = document.getElementById("id_exchange_rate_value");
    const rate = parseFloat(rateInput?.value) || 0;

    let totalUSD = 0;
    let totalSYP = 0;

    document.querySelectorAll("tr.form-row").forEach(function (row) {
        const qtyInput = row.querySelector("input[name*='quantity']");
        const usdInput = row.querySelector("input[name*='unit_cost_usd']");

        if (!qtyInput || !usdInput) return;

        const qty = parseFloat(qtyInput.value) || 0;
        const usd = parseFloat(usdInput.value) || 0;
        const unitSYP = usd * rate;

        // const sypCell = row.querySelector(".field-unit_cost_syp .readonly");
        // if (sypCell) {
        //     sypCell.textContent = unitSYP.toFixed(2);
        // }
        const sypCell = row.querySelector(".field-unit_cost_syp");

        if (sypCell) {
            const readonly = sypCell.querySelector(".readonly");

            if (readonly) {
                readonly.textContent = unitSYP.toFixed(2);
            } else {
                sypCell.innerHTML = unitSYP.toFixed(2);
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
    console.log("JS LOADED");

    const paymentType = document.getElementById("id_payment_type");
    const dueDateRow = document.querySelector(".form-row.field-due_date");

    function toggleDueDate() {
        if (!paymentType || !dueDateRow) return;
        dueDateRow.style.display = paymentType.value === "credit" ? "flex" : "none";
    }

    toggleDueDate();
    if (paymentType) paymentType.addEventListener("change", toggleDueDate);

    const exchangeSelect = document.getElementById("id_exchange_rate");
    const exchangeValue = document.getElementById("id_exchange_rate_value");

    function updateExchangeValue() {
        if (!exchangeSelect || !exchangeValue) return;

        const selectedText = exchangeSelect.options[exchangeSelect.selectedIndex]?.text || "";
        const match = selectedText.match(/[\d.]+$/);

        if (match) {
            exchangeValue.value = parseFloat(match[0]).toFixed(2);
            calculateTotals();
        }
    }

    if (exchangeSelect) exchangeSelect.addEventListener("change", updateExchangeValue);

    document.addEventListener("input", calculateTotals);
    document.addEventListener("change", calculateTotals);

    calculateTotals();
});