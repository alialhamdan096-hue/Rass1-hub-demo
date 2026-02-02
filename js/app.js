/* ============================================
   Rass 1 Hub - Pharmacy Management System
   Main Application JavaScript
   ============================================ */

// ==================== CONSTANTS ====================
const WA_ICON = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

const BRANCH_EMAILS = {
    'RASS2': 'rass2@alraziksa.com',
    'RASS5': 'rass5@alraziksa.com',
    'UNIZAH1': 'unizah1@alraziksa.com',
    'UNIZAH2': 'unizah2@alraziksa.com',
    'UNIZAH3': 'unizah3@alraziksa.com',
    'UNIZAH5': 'unizah5@alraziksa.com',
    'BADAYA1': 'badaya1@alraziksa.com',
    'BADAYA2': 'badaya2@alraziksa.com',
    'BADAYA3': 'badaya3@alraziksa.com',
    'BADAYA5': 'badaya5@alraziksa.com',
    'BADAYA.MOR': 'badaya.mor@alraziksa.com',
    'BUKAYRIAH1': 'bukayriah1@alraziksa.com',
    'BUKAYRIAH2': 'bukayriah2@alraziksa.com',
    'BUKAYRIAH.MOR': 'bukayriah.mor@alraziksa.com',
    'BURIDAH1': 'buridah1@alraziksa.com',
    'BURIDAH2': 'buridah2@alraziksa.com',
    'KHABRA1': 'khabra1@alraziksa.com',
    'MITHNAB1': 'mithnab1@alraziksa.com',
    'MITHNAB2': 'mithnab2@alraziksa.com',
    'RIYADH.KHABRA.MOR': 'riyadh.khabra.mor@alraziksa.com'
};

const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbz3JMLUoPN35vVzOZxZoegDNlbMpAHHS4Mmfc4EN_C94D3Ic8FldoPjP1fADpM8BVLuuQ/exec',
    ITEMS_PER_PAGE: 10,
    SEARCH_DELAY: 300,
    TOAST_DURATION: 3000,
    PHONE_REGEX: /^(966|0)?5\d{8}$/,
    MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December']
};

// ==================== STATE ====================
const State = {
    patients: [],
    editId: null,
    currentPage: 1,
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all',
    entryType: 'refill',
    searchTimeout: null,
    orderItems: []
};

// ==================== UTILITIES ====================
const Utils = {
    formatDate(v) {
        if (!v) return '';
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        const d = new Date(v);
        if (isNaN(d)) return v;
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    formatDisplayDate(s) {
        if (!s) return '-';
        const d = new Date(s);
        if (isNaN(d)) return s;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    getToday() {
        const t = new Date();
        return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    },

    getTomorrow() {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    },

    parseHistory(h) {
        if (!h) return [];
        if (Array.isArray(h)) return h;
        try { return JSON.parse(h); } catch (e) { return []; }
    },

    getRefillDate(p) {
        const d = new Date(p.date);
        d.setDate(d.getDate() + parseInt(p.days || 30));
        return d;
    },

    getDaysUntilRefill(p) {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        const r = this.getRefillDate(p);
        r.setHours(0, 0, 0, 0);
        return Math.ceil((r - t) / (1000 * 60 * 60 * 24));
    },

    sanitize(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    },

    validatePhone(p) {
        return CONFIG.PHONE_REGEX.test(p.replace(/\D/g, ''));
    },

    formatPhone(p) {
        let c = p.replace(/\D/g, '');
        if (c.startsWith('0')) c = '966' + c.substring(1);
        else if (!c.startsWith('966')) c = '966' + c;
        return c;
    },

    debounce(f, d) {
        return function(...a) {
            clearTimeout(State.searchTimeout);
            State.searchTimeout = setTimeout(() => f.apply(this, a), d);
        };
    },

    copyToClipboard(t) {
        navigator.clipboard.writeText(t)
            .then(() => UI.showToast('Copied!', 'success'))
            .catch(() => UI.showToast('Failed', 'error'));
    }
};

// ==================== UI MODULE ====================
const UI = {
    showToast(m, t = 'info') {
        const c = document.getElementById('toastContainer');
        const e = document.createElement('div');
        e.className = 'toast toast-' + t;
        const i = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        e.innerHTML = '<span>' + i[t] + '</span><span>' + m + '</span>';
        c.appendChild(e);
        setTimeout(() => {
            e.classList.add('hiding');
            setTimeout(() => e.remove(), 300);
        }, CONFIG.TOAST_DURATION);
    },

    setLoading(s, t = 'Loading...') {
        const o = document.getElementById('loadingOverlay');
        o.querySelector('.loading-text').textContent = t;
        o.classList.toggle('active', s);
    },

    setSyncStatus(c) {
        const e = document.getElementById('sync');
        e.className = c ? 'sync sync-ok' : 'sync sync-err';
        e.textContent = c ? '✓ Connected to Google Sheets' : '⚠ Offline Mode';
    },

    showModal(o) {
        const { icon = '⚠️', title, message, confirmText = 'Confirm', confirmClass = '', onConfirm } = o;
        document.getElementById('modalIcon').textContent = icon;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        const b = document.getElementById('modalConfirm');
        b.textContent = confirmText;
        b.className = 'modal-confirm ' + confirmClass;
        b.onclick = () => { onConfirm(); this.closeModal(); };
        document.getElementById('confirmModal').classList.add('active');
    },

    closeModal() {
        document.getElementById('confirmModal').classList.remove('active');
    },

    showFieldError(f, s) {
        const e = document.getElementById(f);
        const m = document.getElementById(f + 'Error');
        if (e) e.classList.toggle('error', s);
        if (m) m.classList.toggle('show', s);
    },

    clearFieldErrors() {
        ['phone', 'med', 'date', 'days', 'orderMed', 'orderBranch', 'branch'].forEach(f => this.showFieldError(f, false));
    },

    showAlert(m) {
        document.getElementById('alertText').textContent = m;
        document.getElementById('alertBanner').classList.remove('hidden');
    },

    updateOrdersBadge() {
        const p = State.patients.filter(x => x.type === 'order' && x.orderStatus !== 'delivered').length;
        const t = document.querySelector('[data-page="patients"]');
        let b = t.querySelector('.tab-badge');
        if (p > 0) {
            if (!b) { b = document.createElement('span'); b.className = 'tab-badge'; t.appendChild(b); }
            b.textContent = p;
        } else if (b) b.remove();
    }
};

// ==================== API MODULE ====================
const API = {
    async request(a, d = null) {
        try {
            let u = CONFIG.API_URL + '?action=' + a;
            if (d) u += '&data=' + encodeURIComponent(JSON.stringify(d));
            const r = await fetch(u);
            UI.setSyncStatus(true);
            return await r.json();
        } catch (e) {
            console.error('API Error:', e);
            UI.setSyncStatus(false);
            throw e;
        }
    },

    async loadPatients() {
        UI.setLoading(true, 'Loading...');
        try {
            const d = await this.request('get');
            State.patients = d.map(p => ({
                id: String(p.id || ''),
                type: p.type || 'refill',
                name: p.name || '',
                phone: String(p.phone || ''),
                med: p.med || '',
                date: Utils.formatDate(p.date),
                days: String(p.days || '30'),
                notes: p.notes || '',
                addedDate: Utils.formatDate(p.addedDate) || Utils.formatDate(p.date),
                branch: p.branch || '',
                pickupDate: p.pickupDate || '',
                orderStatus: p.orderStatus || 'waiting',
                arrivedDate: Utils.formatDate(p.arrivedDate),
                deliveredDate: Utils.formatDate(p.deliveredDate),
                reminderSent: p.reminderSent || 'no',
                reminderDate: Utils.formatDate(p.reminderDate),
                converted: p.converted || 'no',
                convertedDate: Utils.formatDate(p.convertedDate),
                history: Utils.parseHistory(p.history)
            }));
            localStorage.setItem('patients_rass1', JSON.stringify(State.patients));
            checkTodayAlerts();
        } catch (e) {
            State.patients = JSON.parse(localStorage.getItem('patients_rass1')) || [];
            UI.showToast('Loaded from cache', 'warning');
        } finally {
            UI.setLoading(false);
            renderPatients();
            UI.updateOrdersBadge();
        }
    },

    async savePatient(p, a) {
        const d = { ...p, history: JSON.stringify(p.history || []) };
        try {
            if (a === 'delete') await fetch(CONFIG.API_URL + '?action=delete&id=' + p.id);
            else await this.request(a, d);
            UI.setSyncStatus(true);
        } catch (e) { UI.setSyncStatus(false); }
        localStorage.setItem('patients_rass1', JSON.stringify(State.patients));
    }
};

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

function changePage(p) {
    State.currentPage = p;
    renderPatients();
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

// ==================== PATIENT ACTIONS ====================
const PatientActions = {
    async save(e) {
        e.preventDefault();
        UI.clearFieldErrors();

        const t = State.entryType;
        const phone = document.getElementById('phone').value;
        const med = document.getElementById('med').value.trim();
        let valid = true;

        if (!Utils.validatePhone(phone)) { UI.showFieldError('phone', true); valid = false; }
        if (!med) { UI.showFieldError('med', true); valid = false; }

        if (t === 'refill') {
            if (!document.getElementById('date').value) { UI.showFieldError('date', true); valid = false; }
            const d = parseInt(document.getElementById('days').value);
            if (!d || d < 1 || d > 365) { UI.showFieldError('days', true); valid = false; }
        } else {
            if (!document.getElementById('branch').value) { UI.showFieldError('branch', true); valid = false; }
        }

        if (!valid) { UI.showToast('Please fix errors', 'error'); return; }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Saving...';

        let pk = '';
        if (t === 'order') {
            const pv = document.getElementById('pickupDate').value;
            if (pv === 'today') pk = Utils.getToday();
            else if (pv === 'tomorrow') pk = Utils.getTomorrow();
            else if (pv === 'custom') pk = document.getElementById('customPickupDate').value;
        }

        const p = {
            id: State.editId || Date.now().toString(),
            type: t,
            name: document.getElementById('name').value.trim(),
            phone: Utils.formatPhone(phone),
            med: med,
            date: t === 'refill' ? document.getElementById('date').value : '',
            days: t === 'refill' ? document.getElementById('days').value : '',
            notes: document.getElementById('notes').value.trim(),
            addedDate: State.editId ? null : Utils.getToday(),
            branch: t === 'order' ? document.getElementById('branch').value : '',
            pickupDate: pk,
            orderStatus: t === 'order' ? 'waiting' : '',
            arrivedDate: '',
            deliveredDate: '',
            reminderSent: 'no',
            reminderDate: '',
            converted: 'no',
            convertedDate: '',
            history: []
        };

        if (State.editId) {
            const x = State.patients.find(i => i.id === State.editId);
            p.addedDate = x.addedDate;
            p.orderStatus = x.orderStatus;
            p.arrivedDate = x.arrivedDate;
            p.deliveredDate = x.deliveredDate;
            p.reminderSent = x.reminderSent;
            p.reminderDate = x.reminderDate;
            p.converted = x.converted;
            p.convertedDate = x.convertedDate;
            p.history = x.history || [];
            State.patients[State.patients.findIndex(i => i.id === State.editId)] = p;
        } else {
            State.patients.push(p);
        }

        await API.savePatient(p, State.editId ? 'update' : 'add');
        UI.showToast(State.editId ? 'Updated!' : 'Added!', 'success');
        renderPatients();
        UI.updateOrdersBadge();
        resetForm();
        btn.disabled = false;
        btn.innerHTML = '<span>➕</span> Add ' + (t === 'refill' ? 'Patient' : 'Order');
    },

    edit(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        State.editId = id;
        setEntryType(p.type || 'refill');
        document.getElementById('name').value = p.name;
        document.getElementById('phone').value = p.phone;
        document.getElementById('med').value = p.med;
        document.getElementById('notes').value = p.notes || '';

        if (p.type === 'refill') {
            document.getElementById('date').value = p.date;
            document.getElementById('days').value = p.days;
        } else {
            document.getElementById('branch').value = p.branch;
            if (p.pickupDate === Utils.getToday()) document.getElementById('pickupDate').value = 'today';
            else if (p.pickupDate === Utils.getTomorrow()) document.getElementById('pickupDate').value = 'tomorrow';
            else if (p.pickupDate) {
                document.getElementById('pickupDate').value = 'custom';
                document.getElementById('customPickupDate').value = p.pickupDate;
                document.getElementById('customDateGroup').style.display = 'block';
            }
        }
        document.getElementById('formTitle').textContent = '✏️ Edit';
        document.getElementById('submitBtn').innerHTML = '<span>💾</span> Update';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    delete(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '🗑️',
            title: 'Delete',
            message: 'Delete "' + (p.name || p.phone) + '"?',
            confirmText: 'Delete',
            confirmClass: 'danger',
            onConfirm: async () => {
                State.patients = State.patients.filter(x => x.id !== id);
                await API.savePatient({ id }, 'delete');
                UI.showToast('Deleted!', 'success');
                renderPatients();
                UI.updateOrdersBadge();
            }
        });
    },

    confirmWhatsApp(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '📱',
            title: 'Send WhatsApp',
            message: 'Send reminder to "' + (p.name || p.phone) + '"?',
            confirmText: 'Send',
            confirmClass: 'success',
            onConfirm: () => this.sendRefillWhatsApp(id)
        });
    },

    sendRefillWhatsApp(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        const m = 'السلام عليكم ورحمة الله وبركاته\nصيدلية الرازي الرس 1 ترحب بكم\n\nهذا تذكير بموعد صرف الدواء الخاص بك:\n\nالدواء: ' + p.med + '\n\nنسعد بتجهيزه لكم عبر:\n\n- الاستلام من الصيدلية\n- التوصيل لموقعكم\n\n📍 موقع الصيدلية:\nhttps://shorturl.at/M2Cq3\n\nنتمنى لكم دوام الصحة والعافية';
        window.open('https://wa.me/' + p.phone + '?text=' + encodeURIComponent(m), '_blank');
        p.reminderSent = 'yes';
        p.reminderDate = Utils.getToday();
        API.savePatient(p, 'update');
        UI.showToast('WhatsApp opened!', 'success');
        renderPatients();
        renderTracking();
    },

    confirmArrived(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '📥',
            title: 'Order Arrived',
            message: 'Send WhatsApp to "' + (p.name || p.phone) + '"?',
            confirmText: 'Yes, Send',
            confirmClass: 'success',
            onConfirm: () => this.markArrived(id)
        });
    },

    async markArrived(id) {
        const p = State.patients.find(x => x.id === id);
        p.orderStatus = 'pending';
        p.arrivedDate = Utils.getToday();
        const m = 'السلام عليكم ورحمة الله وبركاته\nصيدلية الرازي الرس 1\n\nطلبكم جاهز للاستلام ✅\n\nالدواء: ' + p.med + '\n\n📍 موقع الصيدلية:\nhttps://shorturl.at/M2Cq3\n\nنسعد بخدمتكم';
        window.open('https://wa.me/' + p.phone + '?text=' + encodeURIComponent(m), '_blank');
        await API.savePatient(p, 'update');
        UI.showToast('WhatsApp opened!', 'success');
        renderPatients();
        UI.updateOrdersBadge();
    },

    async markDelivered(id) {
        const p = State.patients.find(x => x.id === id);
        p.orderStatus = 'delivered';
        p.deliveredDate = Utils.getToday();
        await API.savePatient(p, 'update');
        UI.showToast('Delivered!', 'success');
        renderPatients();
        UI.updateOrdersBadge();
    },

    async markConverted(id) {
        const p = State.patients.find(x => x.id === id);
        p.converted = 'yes';
        p.convertedDate = Utils.getToday();
        await API.savePatient(p, 'update');
        UI.showToast('Converted!', 'success');
        renderPatients();
        renderTracking();
    },

    async undoConverted(id) {
        const p = State.patients.find(x => x.id === id);
        p.converted = 'no';
        p.convertedDate = '';
        await API.savePatient(p, 'update');
        UI.showToast('Undone', 'info');
        renderTracking();
    },

    async renewPatient(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p.history) p.history = [];
        p.history.push({ date: p.date, reminderDate: p.reminderDate, convertedDate: p.convertedDate });
        p.date = Utils.getToday();
        p.reminderSent = 'no';
        p.reminderDate = '';
        p.converted = 'no';
        p.convertedDate = '';
        await API.savePatient(p, 'update');
        UI.showToast('Renewed!', 'success');
        renderPatients();
        renderTracking();
    }
};

// ==================== ORDERS MODULE ====================
const OrdersModule = {
    addItem(e) {
        e.preventDefault();
        UI.clearFieldErrors();
        const med = document.getElementById('orderMed').value.trim();
        const qty = parseInt(document.getElementById('orderQty').value) || 1;
        const branch = document.getElementById('orderBranch').value;
        const isClient = document.getElementById('orderClient').checked;
        if (!med) { UI.showFieldError('orderMed', true); return; }
        if (!branch) { UI.showFieldError('orderBranch', true); return; }
        State.orderItems.push({ id: Date.now(), med: med, qty: qty, branch: branch, isClient: isClient });
        document.getElementById('orderMed').value = '';
        document.getElementById('orderQty').value = '1';
        document.getElementById('orderClient').checked = false;
        this.renderOrders();
        UI.showToast('Added to list', 'success');
    },

    removeItem(id) {
        State.orderItems = State.orderItems.filter(item => item.id !== id);
        this.renderOrders();
    },

    clearAll() {
        if (State.orderItems.length === 0) return;
        UI.showModal({
            icon: '🗑️',
            title: 'Clear All',
            message: 'Remove all items?',
            confirmText: 'Clear',
            confirmClass: 'danger',
            onConfirm: () => { State.orderItems = []; this.renderOrders(); }
        });
    },

    renderOrders() {
        const c = document.getElementById('ordersList');
        const ss = document.getElementById('sendSection');
        const cb = document.getElementById('clearAllBtn');
        if (State.orderItems.length === 0) {
            c.innerHTML = '<div class="empty">No items</div>';
            ss.style.display = 'none';
            cb.style.display = 'none';
            return;
        }
        cb.style.display = 'inline-flex';
        c.innerHTML = State.orderItems.map(item => `<div class="order-item"><div class="order-item-info"><div class="order-item-med">${Utils.sanitize(item.med)} ${item.isClient ? '<span class="badge badge-client">لعميل</span>' : ''}</div><div class="order-item-details">Qty: ${item.qty}</div><div class="order-item-branch">From: ${item.branch}</div></div><button class="order-item-del" onclick="OrdersModule.removeItem(${item.id})">🗑️</button></div>`).join('');
        ss.style.display = 'block';
        const grouped = {};
        State.orderItems.forEach(item => { if (!grouped[item.branch]) grouped[item.branch] = []; grouped[item.branch].push(item); });
        document.getElementById('groupedOrders').innerHTML = Object.entries(grouped).map(([branch, items]) => `<div class="send-group"><div class="send-group-header"><span class="send-group-title">📍 ${branch}</span><span class="send-group-count">${items.length} items</span></div><div class="send-group-items">${items.map(item => `<div class="send-group-item ${item.isClient ? 'client' : ''}">• ${Utils.sanitize(item.med)} - Qty: ${item.qty}</div>`).join('')}</div><button class="btn btn-info btn-sm" onclick="OrdersModule.sendEmail('${branch}')" style="margin-top:10px">📧 Send to ${branch}</button></div>`).join('');
    },

    sendEmail(branch) {
        const items = State.orderItems.filter(item => item.branch === branch);
        if (items.length === 0) return;
        const email = BRANCH_EMAILS[branch];
        const subject = `طلب تحويل أصناف - صيدلية الرس 1`;
        let body = `السلام عليكم\n\nنرجو تحويل الأصناف التالية:\n\n`;
        items.forEach(item => { body += `• ${item.med} - الكمية: ${item.qty}${item.isClient ? ' (لعميل)' : ''}\n`; });
        body += `\nوجزاكم الله خيراً\nصيدلية الرازي - الرس 1`;
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    },

    sendAllEmails() {
        const branches = [...new Set(State.orderItems.map(item => item.branch))];
        branches.forEach((branch, index) => { setTimeout(() => { this.sendEmail(branch); }, index * 500); });
    }
};

// ==================== RENDER FUNCTIONS ====================
function renderPatients() {
    const s = State.searchQuery.toLowerCase(), tf = State.typeFilter, sf = State.statusFilter;
    let f = State.patients.filter(p => {
        const ms = p.name.toLowerCase().includes(s) || p.med.toLowerCase().includes(s) || p.phone.includes(s);
        if (!ms) return false;
        if (tf !== 'all' && p.type !== tf) return false;
        if (sf !== 'all') {
            if (p.type === 'refill') {
                const d = Utils.getDaysUntilRefill(p);
                if (sf === 'overdue' && d >= 0) return false;
                if (sf === 'soon' && (d < 0 || d > 2)) return false;
                if (sf === 'ok' && d <= 2) return false;
                if (sf === 'waiting' || sf === 'pending') return false;
            } else {
                if (sf === 'waiting' && p.orderStatus !== 'waiting') return false;
                if (sf === 'pending' && p.orderStatus !== 'pending') return false;
                if (['overdue', 'soon', 'ok'].includes(sf)) return false;
            }
        }
        return true;
    });

    f.sort((a, b) => {
        if (a.type === 'order' && b.type === 'refill') return -1;
        if (a.type === 'refill' && b.type === 'order') return 1;
        if (a.type === 'order') return new Date(a.addedDate) - new Date(b.addedDate);
        return Utils.getRefillDate(a) - Utils.getRefillDate(b);
    });

    let w = 0, o = 0, po = 0;
    State.patients.forEach(p => {
        if (p.type === 'refill') {
            const d = Utils.getDaysUntilRefill(p);
            if (d < 0) o++;
            else if (d <= 2) w++;
        } else if (p.type === 'order' && p.orderStatus !== 'delivered') po++;
    });

    document.getElementById('total').textContent = State.patients.length;
    document.getElementById('warn').textContent = w;
    document.getElementById('over').textContent = o;
    document.getElementById('pendingOrders').textContent = po;

    const tp = Math.ceil(f.length / CONFIG.ITEMS_PER_PAGE);
    State.currentPage = Math.min(State.currentPage, tp || 1);
    const si = (State.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const pg = f.slice(si, si + CONFIG.ITEMS_PER_PAGE);

    const tb = document.getElementById('patientsTbody');
    if (pg.length === 0) {
        tb.innerHTML = '<tr><td colspan="7"><div class="empty">No records found</div></td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    tb.innerHTML = pg.map(p => {
        const io = p.type === 'order';
        let st, sc, dd;
        if (io) {
            if (p.orderStatus === 'delivered') { st = '✅ Delivered'; sc = 'delivered'; }
            else if (p.orderStatus === 'pending') { st = '⏳ Pending'; sc = 'waiting'; }
            else { st = '🔵 Waiting'; sc = 'info'; }
            dd = p.pickupDate ? Utils.formatDisplayDate(p.pickupDate) : '-';
        } else {
            const d = Utils.getDaysUntilRefill(p);
            dd = Utils.getRefillDate(p).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (d < 0) { st = 'Overdue ' + Math.abs(d) + 'd'; sc = 'danger'; }
            else if (d <= 2) { st = d + 'd left'; sc = 'warn'; }
            else { st = d + 'd left'; sc = 'ok'; }
        }

        const ad = Utils.formatDisplayDate(p.addedDate);
        const hc = (p.history || []).length;
        const hb = hc > 0 ? ' <span class="badge badge-ok">' + hc + '</span>' : '';
        let ac = '';
        if (io) {
            if (p.orderStatus === 'waiting') ac = '<button class="arrived" onclick="PatientActions.confirmArrived(\'' + p.id + '\')" title="Arrived">📥</button><button class="edit" onclick="PatientActions.edit(\'' + p.id + '\')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete(\'' + p.id + '\')" title="Delete">🗑️</button>';
            else if (p.orderStatus === 'pending') ac = '<button class="done" onclick="PatientActions.markDelivered(\'' + p.id + '\')" title="Delivered">✅</button><button class="edit" onclick="PatientActions.edit(\'' + p.id + '\')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete(\'' + p.id + '\')" title="Delete">🗑️</button>';
            else ac = '<button class="edit" onclick="PatientActions.edit(\'' + p.id + '\')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete(\'' + p.id + '\')" title="Delete">🗑️</button>';
        } else {
            ac = '<button class="wa" onclick="PatientActions.confirmWhatsApp(\'' + p.id + '\')" title="WhatsApp">' + WA_ICON + '</button><button class="edit" onclick="PatientActions.edit(\'' + p.id + '\')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete(\'' + p.id + '\')" title="Delete">🗑️</button>';
        }

        return `<tr class="${io ? 'order-row' : ''}">
            <td><span class="type-badge">${io ? '📦' : '💊'}</span></td>
            <td><div class="name">${Utils.sanitize(p.name)}${hb}</div><div class="phone"><span class="phone-copy" onclick="Utils.copyToClipboard('${p.phone}')" title="Copy">📋</span>${Utils.sanitize(p.phone)}</div>${io && p.branch ? '<div class="branch-info">From: ' + p.branch + '</div>' : ''}</td>
            <td><div class="med">${Utils.sanitize(p.med)}</div>${p.notes ? '<div class="phone">' + Utils.sanitize(p.notes) + '</div>' : ''}</td>
            <td><span class="date-added">${ad}</span></td>
            <td>${dd}</td>
            <td><span class="badge badge-${sc}">${st}</span></td>
            <td><div class="actions">${ac}</div></td>
        </tr>`;
    }).join('');

    renderPagination(tp, f.length);
}

function renderPagination(tp, ti) {
    const pg = document.getElementById('pagination');
    if (tp <= 1) { pg.innerHTML = ''; return; }
    let h = '<button onclick="changePage(1)" ' + (State.currentPage === 1 ? 'disabled' : '') + '>«</button><button onclick="changePage(' + (State.currentPage - 1) + ')" ' + (State.currentPage === 1 ? 'disabled' : '') + '>‹</button>';
    const mv = 5;
    let st = Math.max(1, State.currentPage - Math.floor(mv / 2));
    let en = Math.min(tp, st + mv - 1);
    if (en - st + 1 < mv) st = Math.max(1, en - mv + 1);
    for (let i = st; i <= en; i++) h += '<button onclick="changePage(' + i + ')" class="' + (i === State.currentPage ? 'active' : '') + '">' + i + '</button>';
    h += '<button onclick="changePage(' + (State.currentPage + 1) + ')" ' + (State.currentPage === tp ? 'disabled' : '') + '>›</button><button onclick="changePage(' + tp + ')" ' + (State.currentPage === tp ? 'disabled' : '') + '>»</button><span class="pagination-info">' + ti + ' records</span>';
    pg.innerHTML = h;
}

function renderTracking() {
    const fl = document.getElementById('trackFilter').value;
    let l = State.patients.filter(p => p.type === 'refill' && p.reminderSent === 'yes');
    if (fl === 'waiting') l = l.filter(p => p.converted !== 'yes');
    else if (fl === 'converted') l = l.filter(p => p.converted === 'yes');
    l.sort((a, b) => new Date(b.reminderDate) - new Date(a.reminderDate));

    let ts = 0, tc = 0;
    State.patients.filter(p => p.type === 'refill').forEach(p => {
        if (p.reminderSent === 'yes') ts++;
        if (p.converted === 'yes') tc++;
        (p.history || []).forEach(h => { if (h.reminderDate) ts++; if (h.convertedDate) tc++; });
    });

    document.getElementById('tSent').textContent = ts;
    document.getElementById('tConverted').textContent = tc;
    document.getElementById('tRate').textContent = ts > 0 ? Math.round(tc / ts * 100) + '%' : '0%';

    const g = document.getElementById('trackGrid');
    if (l.length === 0) { g.innerHTML = '<div class="empty" style="grid-column:1/-1">No records</div>'; return; }
    g.innerHTML = l.map(p => {
        const hc = (p.history || []).length;
        const hb = hc > 0 ? '<div class="history-badge">🔄 ' + hc + '</div>' : '';
        if (p.converted === 'yes') {
            return `<div class="track-card converted">${hb}<div class="name">${Utils.sanitize(p.name)}</div><div class="phone">${Utils.sanitize(p.phone)}</div><div class="med">${Utils.sanitize(p.med)}</div><div class="info">📤 ${p.reminderDate}<br>✅ ${p.convertedDate}</div><button class="track-btn done" onclick="PatientActions.undoConverted('${p.id}')">✅ Converted (Undo)</button><button class="track-btn renew" onclick="PatientActions.renewPatient('${p.id}')">🔄 Renew</button></div>`;
        } else {
            return `<div class="track-card">${hb}<div class="name">${Utils.sanitize(p.name)}</div><div class="phone">${Utils.sanitize(p.phone)}</div><div class="med">${Utils.sanitize(p.med)}</div><div class="info">📤 ${p.reminderDate}</div><button class="track-btn" onclick="PatientActions.markConverted('${p.id}')">✅ Mark Converted</button></div>`;
        }
    }).join('');
}

// ==================== REPORTS ====================
function generateReport() {
    const m = parseInt(document.getElementById('reportMonth').value);
    const y = parseInt(document.getElementById('reportYear').value);
    generateRefillReport(m, y);
    generateOrdersReport(m, y);
}

function generateRefillReport(m, y) {
    let s = 0, c = 0;
    const cp = [];
    State.patients.filter(p => p.type === 'refill').forEach(p => {
        if (p.reminderSent === 'yes' && p.reminderDate) {
            const rd = new Date(p.reminderDate);
            if (rd.getMonth() === m && rd.getFullYear() === y) {
                s++;
                if (p.converted === 'yes') { c++; cp.push({ name: p.name, phone: p.phone, med: p.med, reminderDate: p.reminderDate, convertedDate: p.convertedDate }); }
            }
        }
        (p.history || []).forEach(h => {
            if (h.reminderDate) {
                const rd = new Date(h.reminderDate);
                if (rd.getMonth() === m && rd.getFullYear() === y) {
                    s++;
                    if (h.convertedDate) { c++; cp.push({ name: p.name, phone: p.phone, med: p.med, reminderDate: h.reminderDate, convertedDate: h.convertedDate }); }
                }
            }
        });
    });
    const r = s > 0 ? Math.round(c / s * 100) : 0;
    const w = s - c;
    const wr = s > 0 ? Math.round(w / s * 100) : 0;
    document.getElementById('rSent').textContent = s;
    document.getElementById('rConverted').textContent = c;
    document.getElementById('rRate').textContent = r + '%';
    document.getElementById('rBar').style.width = r + '%';
    document.getElementById('summaryTb').innerHTML = `<tr><td>📤 Sent</td><td>${s}</td><td>100%</td></tr><tr><td>✅ Converted</td><td>${c}</td><td>${r}%</td></tr><tr><td>⏳ Waiting</td><td>${w}</td><td>${wr}%</td></tr>`;
    document.getElementById('convList').innerHTML = cp.length > 0 ? cp.map(p => `<tr><td class="name">${Utils.sanitize(p.name)}</td><td class="phone">${Utils.sanitize(p.phone)}</td><td class="med">${Utils.sanitize(p.med)}</td><td>${p.reminderDate}</td><td>${p.convertedDate}</td></tr>`).join('') : '<tr><td colspan="5"><div class="empty">No conversions</div></td></tr>';
}

function generateOrdersReport(m, y) {
    let t = 0, d = 0;
    const bs = {}, mc = {};
    State.patients.filter(p => p.type === 'order').forEach(p => {
        const ad = new Date(p.addedDate);
        if (ad.getMonth() === m && ad.getFullYear() === y) {
            t++;
            if (!bs[p.branch]) bs[p.branch] = { total: 0, delivered: 0 };
            bs[p.branch].total++;
            const mn = p.med.toLowerCase().trim();
            mc[mn] = (mc[mn] || 0) + 1;
            if (p.orderStatus === 'delivered') { d++; bs[p.branch].delivered++; }
        }
    });
    const nd = t - d;
    const r = t > 0 ? Math.round(d / t * 100) : 0;
    document.getElementById('oTotal').textContent = t;
    document.getElementById('oDelivered').textContent = d;
    document.getElementById('oNotDelivered').textContent = nd;
    document.getElementById('oRate').textContent = r + '%';
    document.getElementById('oBar').style.width = r + '%';
    const br = Object.entries(bs).sort((a, b) => b[1].total - a[1].total).map(([b, s]) => `<tr><td><strong>${b}</strong></td><td>${s.total}</td><td>${s.delivered}</td><td>${s.total - s.delivered}</td></tr>`).join('');
    document.getElementById('branchSummary').innerHTML = br || '<tr><td colspan="4"><div class="empty">No orders</div></td></tr>';
    const tm = Object.entries(mc).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([med, cnt]) => `<tr><td class="med">${Utils.sanitize(med)}</td><td>${cnt}</td></tr>`).join('');
    document.getElementById('topMeds').innerHTML = tm || '<tr><td colspan="2"><div class="empty">No orders</div></td></tr>';
}

// ==================== GLOBAL EXPORTS ====================
window.PatientActions = PatientActions;
window.OrdersModule = OrdersModule;
window.Utils = Utils;
window.UI = UI;
window.changePage = changePage;
window.resetForm = resetForm;
window.setEntryType = setEntryType;
window.showReportTab = showReportTab;

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

    document.getElementById('patientForm').addEventListener('submit', PatientActions.save);
    document.getElementById('orderForm').addEventListener('submit', (e) => OrdersModule.addItem(e));
    document.getElementById('pickupDate').addEventListener('change', handlePickupDateChange);

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
    API.loadPatients();
    OrdersModule.renderOrders();
});
