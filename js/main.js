import { API } from './api.js';
import { UI } from './modules/ui.js';
import { PatientsModule } from './modules/patients.js';
import { OrdersModule } from './modules/orders.js';
// import { ReportsModule } from './modules/reports.js'; // أنشئه لاحقاً بنفس الطريقة

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 System Starting...');
    
    // تهيئة التاريخ الافتراضي
    document.getElementById('date').valueAsDate = new Date();

    // تشغيل الموديولات
    UI.initTabs();
    PatientsModule.init();
    OrdersModule.init();
    
    // جلب البيانات وبدء العمل
    API.loadPatients();
});
