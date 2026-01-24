import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== REPORTS MODULE ====================
export function generateReport() {
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
