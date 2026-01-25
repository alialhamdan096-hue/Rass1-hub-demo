import './styles/main.css';
import { CONFIG } from './config.js';
import { State } from './state.js';
import { UI } from './components/ui.js';
import { Utils } from './utils/helpers.js';
import { API } from './api/sheets.js';
import { PatientActions } from './modules/patients.js';
import { OrdersModule } from './modules/orders.js';
import { PatientHistory } from './modules/history.js';
import { LabelPrint } from './modules/label.js';
import { ExcelExport } from './modules/export.js';
import { renderTracking } from './modules/tracking.js';
import { generateReport } from './modules/reports.js';
import { renderPatients, changePage } from './modules/render.js';

// ==================== UI HELPERS ====================
function setEntryType(t) {
    State.entryType = t;
    document.getElementById('entryType').value = t;
    document.querySelectorAll('.type-btn').forEach(b => {
        b.classList.remove('active');
        if (b.dataset.type === t) b.classList.add('active');
    });

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
}

function handlePickupDateChange() {
    document.getElementById('customDateGroup').style.display = document.getElementById('pickupDate').value === 'custom' ? 'block' : 'none';
}

function showReportTab(t) {
    document.querySelectorAll('.report-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.report-section').forEach(x => x.classList.remove('active'));
    document.querySelector('[data-report="' + t + '"]').classList.add('active');
    document.getElementById(t === 'refill' ? 'refillReport' : 'ordersReport').classList.add('active');
}

function resetForm() {
    State.editId = null;
    document.getElementById('patientForm').reset();
    document.getElementById('days').value = '30';
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('formTitle').textContent = '➕ Add New';
    document.getElementById('submitBtn').innerHTML = '<span>➕</span> Add ' + (State.entryType === 'refill' ? 'Patient' : 'Order');
    document.getElementById('customDateGroup').style.display = 'none';
    UI.clearFieldErrors();
}

function showPage(n) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(n + 'Page').classList.add('active');
    document.querySelector('[data-page="' + n + '"]').classList.add('active');
    if (n === 'tracking') renderTracking();
    if (n === 'reports') generateReport();
    if (n === 'orders') OrdersModule.renderOrders();
}

function checkTodayAlerts() {
    const t = Utils.getToday();
    const o = State.patients.filter(p => p.type === 'order' && p.orderStatus !== 'delivered' && p.pickupDate === t).length;
    const r = State.patients.filter(p => p.type === 'refill' && Utils.getDaysUntilRefill(p) < 0).length;
    let m = [];
    if (o > 0) m.push(o + ' orders for today');
    if (r > 0) m.push(r + ' overdue refills');
    if (m.length > 0) UI.showAlert('🔔 ' + m.join(' • '));
}

// ==================== GLOBAL EXPORTS ====================
window.PatientActions = PatientActions;
window.OrdersModule = OrdersModule;
window.PatientHistory = PatientHistory;
window.LabelPrint = LabelPrint;
window.ExcelExport = ExcelExport;
window.Utils = Utils;
window.UI = UI;
window.changePage = changePage;
window.resetForm = resetForm;
window.setEntryType = setEntryType;
window.showReportTab = showReportTab;

// Set callbacks for patient actions
PatientActions.setCallbacks(renderPatients, renderTracking);

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').valueAsDate = new Date();

    // Report month/year setup
    const ms = document.getElementById('reportMonth');
    const ys = document.getElementById('reportYear');
    const cd = new Date();
    CONFIG.MONTHS.forEach((m, i) => { ms.innerHTML += '<option value="' + i + '">' + m + '</option>'; });
    ms.value = cd.getMonth();
    for (let y = cd.getFullYear(); y <= cd.getFullYear() + 3; y++) { ys.innerHTML += '<option value="' + y + '">' + y + '</option>'; }
    ys.value = cd.getFullYear();

    // Event listeners
    document.querySelectorAll('.tab').forEach(t => {
        t.addEventListener('click', () => showPage(t.dataset.page));
    });

    document.querySelectorAll('.type-btn').forEach(b => {
        b.addEventListener('click', () => setEntryType(b.dataset.type));
    });

    document.querySelectorAll('.report-tab').forEach(t => {
        t.addEventListener('click', () => showReportTab(t.dataset.report));
    });

    document.getElementById('patientForm').addEventListener('submit', (e) => PatientActions.save(e));
    document.getElementById('orderForm').addEventListener('submit', (e) => OrdersModule.addItem(e));
    document.getElementById('pickupDate').addEventListener('change', handlePickupDateChange);
    document.getElementById('clearAllBtn').addEventListener('click', () => OrdersModule.clearAll());
    document.getElementById('sendAllBtn').addEventListener('click', () => OrdersModule.sendAllEmails());
    document.getElementById('modalCancelBtn').addEventListener('click', () => UI.closeModal());
    document.getElementById('historyCloseBtn').addEventListener('click', () => PatientHistory.close());
    document.getElementById('labelCloseBtn').addEventListener('click', () => LabelPrint.close());
    document.getElementById('labelCancelBtn').addEventListener('click', () => LabelPrint.close());
    document.getElementById('labelPrintBtn').addEventListener('click', () => LabelPrint.print());

    // Export modal events
    document.getElementById('exportBtn').addEventListener('click', () => ExcelExport.showExportModal());
    document.getElementById('exportCloseBtn').addEventListener('click', () => ExcelExport.closeExportModal());
    document.getElementById('exportAllBtn').addEventListener('click', () => { ExcelExport.exportAll(); ExcelExport.closeExportModal(); });
    document.getElementById('exportRefillsBtn').addEventListener('click', () => { ExcelExport.exportRefills(); ExcelExport.closeExportModal(); });
    document.getElementById('exportOrdersBtn').addEventListener('click', () => { ExcelExport.exportOrders(); ExcelExport.closeExportModal(); });
    document.getElementById('exportFilteredBtn').addEventListener('click', () => { ExcelExport.exportFiltered(); ExcelExport.closeExportModal(); });
    document.getElementById('exportReportBtn').addEventListener('click', () => {
        const month = parseInt(document.getElementById('reportMonth').value);
        const year = parseInt(document.getElementById('reportYear').value);
        ExcelExport.exportMonthlyReport(month, year);
        ExcelExport.closeExportModal();
    });

    document.getElementById('search').addEventListener('input', Utils.debounce(e => {
        State.searchQuery = e.target.value;
        State.currentPage = 1;
        renderPatients();
    }, CONFIG.SEARCH_DELAY));

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

    document.getElementById('trackFilter').addEventListener('change', renderTracking);
    document.getElementById('reportMonth').addEventListener('change', generateReport);
    document.getElementById('reportYear').addEventListener('change', generateReport);

    // Load data
    API.loadPatients(renderPatients, checkTodayAlerts);
    OrdersModule.loadOrders();
    OrdersModule.renderOrders();
});
