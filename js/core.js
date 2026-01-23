/* ══════════════════════════════════════════════════════════════
CORE - State, Utils & UI
══════════════════════════════════════════════════════════════ */

// ==================== STATE ====================
const State = {
patients: [],
editId: null,
currentPage: 1,
searchQuery: ‘’,
statusFilter: ‘all’,
typeFilter: ‘all’,
entryType: ‘refill’,
searchTimeout: null,
orderItems: []
};

// ==================== UTILS ====================
const Utils = {
formatDate(v) {
if (!v) return ‘’;
if (typeof v === ‘string’ && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
const d = new Date(v);
if (isNaN(d)) return v;
return d.getFullYear() + ‘-’ + String(d.getMonth() + 1).padStart(2, ‘0’) + ‘-’ + String(d.getDate()).padStart(2, ‘0’);
},

```
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
    return function (...a) {
        clearTimeout(State.searchTimeout);
        State.searchTimeout = setTimeout(() => f.apply(this, a), d);
    };
},

copyToClipboard(t) {
    navigator.clipboard.writeText(t)
        .then(() => UI.showToast('Copied!', 'success'))
        .catch(() => UI.showToast('Failed', 'error'));
}
```

};

// ==================== UI ====================
const UI = {
showToast(m, t = ‘info’) {
const c = document.getElementById(‘toastContainer’);
const e = document.createElement(‘div’);
e.className = ‘toast toast-’ + t;
const i = { success: ‘✅’, error: ‘❌’, warning: ‘⚠️’, info: ‘ℹ️’ };
e.innerHTML = ‘<span>’ + i[t] + ‘</span><span>’ + m + ‘</span>’;
c.appendChild(e);
setTimeout(() => {
e.classList.add(‘hiding’);
setTimeout(() => e.remove(), 300);
}, CONFIG.TOAST_DURATION);
},

```
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
```

};

// Global exports
window.State = State;
window.Utils = Utils;
window.UI = UI;
