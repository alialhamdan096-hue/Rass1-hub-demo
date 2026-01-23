import { State, Config } from '../core.js';
import { UI } from './ui.js';
import { Utils } from '../utils.js';

export const OrdersModule = {
    init() {
        window.OrdersModule = this; // Expose for HTML buttons
        document.getElementById('orderForm').addEventListener('submit', (e) => this.addItem(e));
    },

    addItem(e) {
        e.preventDefault();
        UI.clearFieldErrors();
        const med = document.getElementById('orderMed').value.trim();
        const qty = parseInt(document.getElementById('orderQty').value) || 1;
        const branch = document.getElementById('orderBranch').value;
        const isClient = document.getElementById('orderClient').checked;
        
        if (!med) { UI.showFieldError('orderMed', true); return; }
        if (!branch) { UI.showFieldError('orderBranch', true); return; }
        
        State.orderItems.push({id: Date.now(), med, qty, branch, isClient});
        document.getElementById('orderMed').value = '';
        this.renderOrders();
        UI.showToast('Added to list', 'success');
    },

    removeItem(id) {
        State.orderItems = State.orderItems.filter(item => item.id !== id);
        this.renderOrders();
    },

    renderOrders() {
        // ... (انسخ منطق renderOrders هنا)
        // ... تأكد أن الأزرار في الـ HTML تستدعي OrdersModule.removeItem()
    },
    
    sendAllEmails() {
        // ... (انسخ منطق الإرسال)
    }
};
