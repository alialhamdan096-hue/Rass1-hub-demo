/* ══════════════════════════════════════════════════════════════
API - Google Sheets Communication
══════════════════════════════════════════════════════════════ */

const API = {
async request(a, d = null) {
try {
let u = CONFIG.API_URL + ‘?action=’ + a;
if (d) u += ‘&data=’ + encodeURIComponent(JSON.stringify(d));
const r = await fetch(u);
UI.setSyncStatus(true);
return await r.json();
} catch (e) {
console.error(‘API Error:’, e);
UI.setSyncStatus(false);
throw e;
}
},

```
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
    } catch (e) {
        UI.setSyncStatus(false);
    }
    localStorage.setItem('patients_rass1', JSON.stringify(State.patients));
}
```

};

// Global export
window.API = API;
