import { CONFIG, WA_ICON } from '../config.js';
import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== RENDER FUNCTIONS ====================
export function renderPatients() {
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
            ac = '<button class="wa" onclick="PatientActions.confirmWhatsApp(\'' + p.id + '\')" title="WhatsApp">' + WA_ICON + '</button><button class="history-btn" onclick="PatientHistory.show(\'' + p.id + '\')" title="السجل">📋</button><button class="edit" onclick="PatientActions.edit(\'' + p.id + '\')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete(\'' + p.id + '\')" title="Delete">🗑️</button>';
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

export function changePage(p) {
    State.currentPage = p;
    renderPatients();
}
