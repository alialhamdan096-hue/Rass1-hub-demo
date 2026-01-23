import { State, Events } from '../core.js';

export const UI = {
    initTabs() {
        // ⚠️ الجسر: دالة تغيير الصفحة
        window.changePage = (pageName) => {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById(pageName + 'Page').classList.add('active');
            const tab = document.querySelector(`[data-page="${pageName}"]`);
            if(tab) tab.classList.add('active');
            
            if(pageName === 'tracking') Events.emit('tracking:update');
        };

        // ربط أزرار التبويبات
        document.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => window.changePage(btn.dataset.page));
        });
        
        // ⚠️ الجسر: دالة التبويبات الداخلية للتقارير
        window.showReportTab = (type) => {
            document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
            
            document.querySelector(`[data-report="${type}"]`).classList.add('active');
            document.getElementById(type === 'refill' ? 'refillReport' : 'ordersReport').classList.add('active');
        };
    },

    showToast(msg, type='info') {
        const c = document.getElementById('toastContainer');
        const d = document.createElement('div');
        d.className = `toast toast-${type}`;
        d.innerText = msg;
        c.appendChild(d);
        setTimeout(() => d.remove(), 3000);
    },

    showLoading(show) {
        const el = document.getElementById('loadingOverlay');
        if(el) el.style.display = show ? 'flex' : 'none';
    },

    confirmDelete(id) {
        if(confirm('Are you sure you want to delete?')) {
            import('../api.js').then(mod => mod.API.savePatient({id}, 'delete'));
        }
    },
    
    confirmArrived(id) {
        if(confirm('Notify patient that order arrived?')) {
           // Logic to notify
        }
    },
    
    markDelivered(id) {
         import('../api.js').then(mod => {
             // Logic to update status
         });
    }
};
