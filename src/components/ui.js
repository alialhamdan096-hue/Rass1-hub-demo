import { CONFIG } from '../config.js';
import { State } from '../state.js';

// ==================== UI MODULE ====================
export const UI = {
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
