import { State, Config, Events } from '../core.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const OrdersModule = {
    init() {
        // ربط فورم إضافة الأصناف للقائمة
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            // استنساخ لإزالة أي ربط سابق
            const newForm = orderForm.cloneNode(true);
            orderForm.parentNode.replaceChild(newForm, orderForm);
            
            newForm.addEventListener('submit', (e) => this.addItem(e));
        }

        // ربط زر مسح الكل
        const clearBtn = document.getElementById('clearAllBtn');
        if (clearBtn) {
            const newBtn = clearBtn.cloneNode(true);
            clearBtn.parentNode.replaceChild(newBtn, clearBtn);
            newBtn.addEventListener('click', () => this.clearAll());
        }
        
        // ربط زر إرسال الكل
        const sendAllBtn = document.getElementById('sendAllBtn');
        if (sendAllBtn) {
            const newSend = sendAllBtn.cloneNode(true);
            sendAllBtn.parentNode.replaceChild(newSend, sendAllBtn);
            newSend.addEventListener('click', () => this.sendAllEmails());
        }

        // تصدير الدوال للـ HTML عشان الأزرار اللي داخل الجدول تشتغل
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
        UI.showFieldError('orderMed', false);
        UI.showFieldError('orderBranch', false);

        const med = document.getElementById('orderMed').value.trim();
        const qty = parseInt(document.getElementById('orderQty').value) || 1;
        const branch = document.getElementById('orderBranch').value;
        const isClient = document.getElementById('orderClient').checked;

        if (!med) { UI.showFieldError('orderMed', true); return; }
        if (!branch) { UI.showFieldError('orderBranch', true); return; }

        State.orderItems.push({
            id: Date.now(),
            med: med,
            qty: qty,
            branch: branch,
            isClient: isClient
        });

        // تنظيف الخانات
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
        
        // استخدام Confirm Modal بدلاً من UI.showModal لتبسيط التبعيات إذا لم تكن موجودة
        if(confirm('Are you sure you want to clear all items?')) {
            State.orderItems = [];
            this.renderOrders();
            UI.showToast('List cleared', 'info');
        }
    },

    renderOrders() {
        const listContainer = document.getElementById('ordersList');
        const sendSection = document.getElementById('sendSection');
        const clearBtn = document.getElementById('clearAllBtn');

        if (!listContainer) return;

        if (State.orderItems.length === 0) {
            listContainer.innerHTML = '<div class="empty">No items</div>';
            if(sendSection) sendSection.style.display = 'none';
            if(clearBtn) clearBtn.style.display = 'none';
            return;
        }

        if(clearBtn) clearBtn.style.display = 'inline-flex';
        
        // رسم القائمة
        listContainer.innerHTML = State.orderItems.map(item => `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-med">
                        ${Utils.sanitize(item.med)} 
                        ${item.isClient ? '<span class="badge badge-client">لعميل</span>' : ''}
                    </div>
                    <div class="order-item-details">Qty: ${item.qty}</div>
                    <div class="order-item-branch">From: ${item.branch}</div>
                </div>
                <button class="order-item-del" onclick="OrdersModule.removeItem(${item.id})">🗑️</button>
            </div>
        `).join('');

        // رسم قسم الإرسال (تجميع حسب الفرع)
        if(sendSection) {
            sendSection.style.display = 'block';
            const grouped = {};
            State.orderItems.forEach(item => {
                if (!grouped[item.branch]) grouped[item.branch] = [];
                grouped[item.branch].push(item);
            });

            document.getElementById('groupedOrders').innerHTML = Object.entries(grouped).map(([branch, items]) => `
                <div class="send-group">
                    <div class="send-group-header">
                        <span class="send-group-title">📍 ${branch}</span>
                        <span class="send-group-count">${items.length} items</span>
                    </div>
                    <div class="send-group-items">
                        ${items.map(item => `<div class="send-group-item ${item.isClient ? 'client' : ''}">• ${Utils.sanitize(item.med)} - Qty: ${item.qty}</div>`).join('')}
                    </div>
                    <button class="btn btn-info btn-sm" onclick="OrdersModule.sendEmail('${branch}')" style="margin-top:10px">📧 Send to ${branch}</button>
                </div>
            `).join('');
        }
    },

    sendEmail(branch) {
        const items = State.orderItems.filter(item => item.branch === branch);
        if (items.length === 0) return;

        const email = Config.BRANCH_EMAILS[branch];
        const subject = `طلب تحويل أصناف - صيدلية الرس 1`;
        let body = `السلام عليكم\n\nنرجو تحويل الأصناف التالية:\n\n`;
        
        items.forEach(item => {
            body += `• ${item.med} - الكمية: ${item.qty}${item.isClient ? ' (لعميل)' : ''}\n`;
        });
        
        body += `\nوجزاكم الله خيراً\nصيدلية الرازي - الرس 1`;
        
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    },

    sendAllEmails() {
        const branches = [...new Set(State.orderItems.map(item => item.branch))];
        branches.forEach((branch, index) => {
            setTimeout(() => {
                this.sendEmail(branch);
            }, index * 500);
        });
    }
};
