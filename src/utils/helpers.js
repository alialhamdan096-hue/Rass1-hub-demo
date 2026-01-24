import { CONFIG } from '../config.js';
import { State } from '../state.js';
import { UI } from '../components/ui.js';

// ==================== UTILITIES ====================
export const Utils = {
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
