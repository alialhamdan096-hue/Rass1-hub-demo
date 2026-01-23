import { UI } from './modules/ui.js';
import { PatientsModule } from './modules/patients.js';
import { OrdersModule } from './modules/orders.js';
import { TrackingModule } from './modules/tracking.js';
import { ReportsModule } from './modules/reports.js';
import { API } from './api.js';
import { Events } from './core.js';

console.log('🚀 Main script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Ready, initializing modules...');
    
    // 1. تشغيل الواجهة
    UI.initTabs();

    // 2. تشغيل الموديولات (هنا يتم ربط الأزرار بـ window)
    PatientsModule.init();
    OrdersModule.init();
    TrackingModule.init();
    ReportsModule.init();
    
    // 3. ضبط التاريخ
    const dateInput = document.getElementById('date');
    if(dateInput) dateInput.valueAsDate = new Date();

    // 4. تحميل البيانات
    console.log('📡 Fetching data...');
    API.loadPatients();
});
