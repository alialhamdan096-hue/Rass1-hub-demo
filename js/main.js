/* ══════════════════════════════════════════════════════════════
MAIN.JS - Entry Point
══════════════════════════════════════════════════════════════ */

// ==================== UI HELPERS ====================
function setEntryType(t) {
State.entryType = t;
document.getElementById(‘entryType’).value = t;
document.querySelectorAll(’.type-btn’).forEach(b => {
b.classList.remove(‘active’);
if (b.dataset.type === t) b.classList.add(‘active’);
});

```
// Dynamic Label Switching
const medLabel = document.getElementById('medLabel');
const medInput = document.getElementById('med');

if (t === 'refill') {
    medLabel.innerHTML = 'Medication <span class="required">*</span>';
    medInput.placeholder = 'Medication name';
} else {
    medLabel.innerHTML = 'Item Name <span class="required">*</span>';
    medInput.placeholder = 'Product or Item name';
}

document.getElementById('refillFields').style.display = t === 'refill' ? 'block' : 'none';
document.getElementById('orderFields').style.display = t === 'order' ? 'block' : 'none';
document.getElementById('submitBtn').innerHTML = '<span>➕</span> Add ' + (t === 'refill' ? 'Patient' : 'Order');
UI.clearFieldErrors();
```

}

function handlePickupDateChange() {
document.getElementById(‘customDateGroup’).style.display =
document.getElementById(‘pickupDate’).value === ‘custom’ ? ‘block’ : ‘none’;
}

function resetForm() {
State.editId = null;
document.getElementById(‘patientForm’).reset();
document.getElementById(‘days’).value = ‘30’;
document.getElementById(‘date’).valueAsDate = new Date();
document.getElementById(‘formTitle’).textContent = ‘➕ Add New’;
document.getElementById(‘submitBtn’).innerHTML = ’<span>➕</span> Add ’ + (State.entryType === ‘refill’ ? ‘Patient’ : ‘Order’);
document.getElementById(‘customDateGroup’).style.display = ‘none’;
UI.clearFieldErrors();
}

function showPage(n) {
document.querySelectorAll(’.page’).forEach(p => p.classList.remove(‘active’));
document.querySelectorAll(’.tab’).forEach(t => t.classList.remove(‘active’));
document.getElementById(n + ‘Page’).classList.add(‘active’);
document.querySelector(’[data-page=”’ + n + ‘”]’).classList.add(‘active’);

```
if (n === 'tracking') renderTracking();
if (n === 'reports') generateReport();
if (n === 'orders') OrdersModule.renderOrders();
```

}

function checkTodayAlerts() {
const t = Utils.getToday();
const o = State.patients.filter(p => p.type === ‘order’ && p.orderStatus !== ‘delivered’ && p.pickupDate === t).length;
const r = State.patients.filter(p => p.type === ‘refill’ && Utils.getDaysUntilRefill(p) < 0).length;

```
let m = [];
if (o > 0) m.push(o + ' orders for today');
if (r > 0) m.push(r + ' overdue refills');
if (m.length > 0) UI.showAlert('🔔 ' + m.join(' • '));
```

}

// Global exports
window.setEntryType = setEntryType;
window.resetForm = resetForm;
window.checkTodayAlerts = checkTodayAlerts;

// ==================== INITIALIZE ====================
document.addEventListener(‘DOMContentLoaded’, () => {
// Set today’s date
document.getElementById(‘date’).valueAsDate = new Date();

```
// Report month/year dropdowns
const ms = document.getElementById('reportMonth');
const ys = document.getElementById('reportYear');
const cd = new Date();

CONFIG.MONTHS.forEach((m, i) => {
    ms.innerHTML += '<option value="' + i + '">' + m + '</option>';
});
ms.value = cd.getMonth();

for (let y = cd.getFullYear(); y <= cd.getFullYear() + 3; y++) {
    ys.innerHTML += '<option value="' + y + '">' + y + '</option>';
}
ys.value = cd.getFullYear();

// Tab navigation
document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => showPage(t.dataset.page));
});

// Form submissions
document.getElementById('patientForm').addEventListener('submit', PatientActions.save);
document.getElementById('orderForm').addEventListener('submit', (e) => OrdersModule.addItem(e));

// Pickup date change
document.getElementById('pickupDate').addEventListener('change', handlePickupDateChange);

// Search with debounce
document.getElementById('search').addEventListener('input', Utils.debounce(e => {
    State.searchQuery = e.target.value;
    State.currentPage = 1;
    renderPatients();
}, CONFIG.SEARCH_DELAY));

// Filters
document.getElementById('typeFilter').addEventListener('change', e => {
    State.typeFilter = e.target.value;
    State.currentPage = 1;
    renderPatients();
});

document.getElementById('statusFilter').addEventListener('change', e => {
    State.statusFilter = e.target.value;
    State.currentPage = 1;
    renderPatients();
});

// Tracking filter
document.getElementById('trackFilter').addEventListener('change', renderTracking);

// Report filters
document.getElementById('reportMonth').addEventListener('change', generateReport);
document.getElementById('reportYear').addEventListener('change', generateReport);

// Load data
API.loadPatients();
OrdersModule.renderOrders();
```

});
