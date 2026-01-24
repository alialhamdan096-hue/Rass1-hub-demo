import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== TRACKING MODULE ====================
export function renderTracking() {
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
