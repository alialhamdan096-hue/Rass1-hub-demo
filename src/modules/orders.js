import { State } from '../state.js';
import { UI } from '../components/ui.js';
import { Utils } from '../utils/helpers.js';
import { BRANCH_EMAILS } from '../config.js';

// ==================== ORDERS MODULE ====================
export const OrdersModule = {
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

        // Open Gmail directly in browser
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    },

    sendAllEmails() {
        const branches = [...new Set(State.orderItems.map(item => item.branch))];
        branches.forEach((branch, index) => { setTimeout(() => { this.sendEmail(branch); }, index * 500); });
    }
};
