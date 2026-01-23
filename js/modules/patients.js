/* ══════════════════════════════════════════════════════════════
PATIENTS MODULE
══════════════════════════════════════════════════════════════ */

const PatientActions = {
async save(e) {
e.preventDefault();
UI.clearFieldErrors();

```
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
```

};

// ==================== RENDER PATIENTS ====================
function renderPatients() {
const s = State.searchQuery.toLowerCase(), tf = State.typeFilter, sf = State.statusFilter;
let f = State.patients.filter(p => {
const ms = p.name.toLowerCase().includes(s) || p.med.toLowerCase().includes(s) || p.phone.includes(s);
if (!ms) return false;
if (tf !== ‘all’ && p.type !== tf) return false;
if (sf !== ‘all’) {
if (p.type === ‘refill’) {
const d = Utils.getDaysUntilRefill(p);
if (sf === ‘overdue’ && d >= 0) return false;
if (sf === ‘soon’ && (d < 0 || d > 2)) return false;
if (sf === ‘ok’ && d <= 2) return false;
if (sf === ‘waiting’ || sf === ‘pending’) return false;
} else {
if (sf === ‘waiting’ && p.orderStatus !== ‘waiting’) return false;
if (sf === ‘pending’ && p.orderStatus !== ‘pending’) return false;
if ([‘overdue’, ‘soon’, ‘ok’].includes(sf)) return false;
}
}
return true;
});

```
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

    return '<tr class="' + (io ? 'order-row' : '') + '"><td><span class="type-badge">' + (io ? '📦' : '💊') + '</span></td><td><div class="name">' + Utils.sanitize(p.name) + hb + '</div><div class="phone"><span class="phone-copy" onclick="Utils.copyToClipboard(\'' + p.phone + '\')" title="Copy">📋</span>' + Utils.sanitize(p.phone) + '</div>' + (io && p.branch ? '<div class="branch-info">From: ' + p.branch + '</div>' : '') + '</td><td><div class="med">' + Utils.sanitize(p.med) + '</div>' + (p.notes ? '<div class="phone">' + Utils.sanitize(p.notes) + '</div>' : '') + '</td><td><span class="date-added">' + ad + '</span></td><td>' + dd + '</td><td><span class="badge badge-' + sc + '">' + st + '</span></td><td><div class="actions">' + ac + '</div></td></tr>';
}).join('');

renderPagination(tp, f.length);
```

}

function renderPagination(tp, ti) {
const pg = document.getElementById(‘pagination’);
if (tp <= 1) { pg.innerHTML = ‘’; return; }
let h = ’<button onclick=“changePage(1)” ’ + (State.currentPage === 1 ? ‘disabled’ : ‘’) + ‘>«</button>’;
h += ‘<button onclick=“changePage(’ + (State.currentPage - 1) + ’)” ’ + (State.currentPage === 1 ? ‘disabled’ : ‘’) + ‘>‹</button>’;
const mv = 5;
let st = Math.max(1, State.currentPage - Math.floor(mv / 2));
let en = Math.min(tp, st + mv - 1);
if (en - st + 1 < mv) st = Math.max(1, en - mv + 1);
for (let i = st; i <= en; i++) h += ‘<button onclick="changePage(' + i + ')" class="' + (i === State.currentPage ? 'active' : '') + '">’ + i + ‘</button>’;
h += ‘<button onclick=“changePage(’ + (State.currentPage + 1) + ’)” ’ + (State.currentPage === tp ? ‘disabled’ : ‘’) + ‘>›</button>’;
h += ‘<button onclick=“changePage(’ + tp + ‘)” ’ + (State.currentPage === tp ? ‘disabled’ : ‘’) + ‘>»</button>’;
h += ‘<span class="pagination-info">’ + ti + ’ records</span>’;
pg.innerHTML = h;
}

function changePage(p) { State.currentPage = p; renderPatients(); }

// ==================== RENDER TRACKING ====================
function renderTracking() {
const fl = document.getElementById(‘trackFilter’).value;
let l = State.patients.filter(p => p.type === ‘refill’ && p.reminderSent === ‘yes’);
if (fl === ‘waiting’) l = l.filter(p => p.converted !== ‘yes’);
else if (fl === ‘converted’) l = l.filter(p => p.converted === ‘yes’);
l.sort((a, b) => new Date(b.reminderDate) - new Date(a.reminderDate));

```
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
        return '<div class="track-card converted">' + hb + '<div class="name">' + Utils.sanitize(p.name) + '</div><div class="phone">' + Utils.sanitize(p.phone) + '</div><div class="med">' + Utils.sanitize(p.med) + '</div><div class="info">📤 ' + p.reminderDate + '<br>✅ ' + p.convertedDate + '</div><button class="track-btn done" onclick="PatientActions.undoConverted(\'' + p.id + '\')">✅ Converted (Undo)</button><button class="track-btn renew" onclick="PatientActions.renewPatient(\'' + p.id + '\')">🔄 Renew</button></div>';
    } else {
        return '<div class="track-card">' + hb + '<div class="name">' + Utils.sanitize(p.name) + '</div><div class="phone">' + Utils.sanitize(p.phone) + '</div><div class="med">' + Utils.sanitize(p.med) + '</div><div class="info">📤 ' + p.reminderDate + '</div><button class="track-btn" onclick="PatientActions.markConverted(\'' + p.id + '\')">✅ Mark Converted</button></div>';
    }
}).join('');
```

}

// Global exports
window.PatientActions = PatientActions;
window.renderPatients = renderPatients;
window.renderTracking = renderTracking;
window.changePage = changePage;
