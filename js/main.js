import { API } from './api.js';
import { UI } from './modules/ui.js';
import { PatientsModule } from './modules/patients.js';
import { OrdersModule } from './modules/orders.js';
import { TrackingModule } from './modules/tracking.js';
import { ReportsModule } from './modules/reports.js';
import { Events } from './core.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Rass1 Hub Starting...');
    
    // 1. تهيئة التبويبات والواجهة
    UI.initTabs();

    // 2. تشغيل الموديولات (المهمة جداً لعمل الأزرار)
    PatientsModule.init();
    OrdersModule.init();
    TrackingModule.init();
    ReportsModule.init();
    
    // 3. ضبط التاريخ الافتراضي
    const dateInput = document.getElementById('date');
    if(dateInput) dateInput.valueAsDate = new Date();

    // 4. الاستماع لتحديث عداد الطلبات
    Events.on('orders:badge', (count) => {
        const t = document.querySelector('[data-page="patients"]');
        if(t) {
            let b = t.querySelector('.tab-badge');
            if(count > 0){
                if(!b){ b = document.createElement('span'); b.className = 'tab-badge'; t.appendChild(b); }
                b.textContent = count;
            } else if(b) {
                b.remove();
            }
        }
    });

    // 5. جلب البيانات من قوقل شيت
    API.loadPatients();
});
