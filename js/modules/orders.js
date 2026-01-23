import { State, Config } from '../core.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const OrdersModule = {
    init() {
        const form = document.getElementById('orderForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.addItem(e));
        }

        // ⚠️ الجسر: ربط الدوال بـ Window عشان أزرار الحذف في الجدول
        window.OrdersModule = {
            removeItem: (id) => this.removeItem(id),
            sendEmail: (branch) => this.sendEmail(branch),
            clearAll: () => this.clearAll(),
            sendAllEmails: () => this.sendAllEmails()
        };

        this.renderOrders();
    },

    addItem(e) {
        e.preventDefault();
        const med = document.getElementById('orderMed').value;
        const branch = document.getElementById('orderBranch').value;
        
        if(!med || !branch) { UI.showToast('أكمل البيانات', 'error'); return; }

        State.orderItems.push({
            id: Date.now(), med, branch,
            qty: document.getElementById('orderQty').value,
            isClient: document.getElementById('orderClient').checked
        });
        
        this.renderOrders();
        e.target.reset();
        UI.showToast('Added to list', 'success');
    },

    removeItem(id) {
        State.orderItems = State.orderItems.filter(x => x.id !== id);
        this.renderOrders();
    },

    renderOrders() {
        const div = document.getElementById('ordersList');
        if(!div) return;
        
        if(State.orderItems.length === 0) {
            div.innerHTML = '<div class="empty">No items</div>';
            document.getElementById('sendSection').style.display = 'none';
            document.getElementById('clearAllBtn').style.display = 'none';
            return;
        }

        document.getElementById('clearAllBtn').style.display = 'block';
        document.getElementById('sendSection').style.display = 'block';

        div.innerHTML = State.orderItems.map(i => `
            <div class="order-item">
                <div class="info"><b>${i.med}</b><br><small>${i.branch} (Qty: ${i.qty})</small></div>
                <button class="del" onclick="OrdersModule.removeItem(${i.id})">🗑️</button>
            </div>
        `).join('');

        // تجهيز قائمة الإرسال (Grouped)
        // ... (نفس الكود السابق للعرض) ...
        const grouped = {}; 
        State.orderItems.forEach(i => { if(!grouped[i.branch]) grouped[i.branch]=[]; grouped[i.branch].push(i) });
        
        document.getElementById('groupedOrders').innerHTML = Object.entries(grouped).map(([br, items]) => `
            <div class="send-group">
                <div style="font-weight:bold">📍 ${br} (${items.length})</div>
                <button class="btn btn-sm btn-info" onclick="OrdersModule.sendEmail('${br}')">📧 Send Email</button>
            </div>
        `).join('');
    },
    
    sendEmail(branch) {
        const email = Config.BRANCH_EMAILS[branch];
        const items = State.orderItems.filter(i => i.branch === branch);
        let body = `Please transfer:\n\n`;
        items.forEach(i => body += `- ${i.med} (Qty: ${i.qty})\n`);
        window.open(`mailto:${email}?subject=Transfer Request&body=${encodeURIComponent(body)}`);
    }
};
