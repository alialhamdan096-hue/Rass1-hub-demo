import { Config } from './core.js';

export const Utils = {
    // 1. جلب تاريخ اليوم (مهم جداً)
    getToday() {
        return new Date().toISOString().split('T')[0];
    },

    // 2. دالة الحساب المفقودة (هذي سبب الخطأ عندك) ⚠️
    calcReminder(dateStr, days) {
        if (!dateStr || !days) return '';
        const date = new Date(dateStr);
        // إضافة الأيام للتاريخ
        date.setDate(date.getDate() + parseInt(days));
        return date.toISOString().split('T')[0];
    },

    // 3. تنسيق التاريخ للعرض
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // تنسيق بريطاني يوم/شهر/سنة
        return d.toLocaleDateString('en-GB');
    },

    // 4. التحقق من رقم الجوال
    validatePhone(phone) {
        // يقبل 05xxxxxxxxx أو 9665xxxxxxxxx
        const regex = /^(966|0)?5\d{8}$/;
        // نحذف أي مسافات أو رموز قبل الفحص
        return regex.test(phone.replace(/\D/g, ''));
    },

    // 5. تنسيق رقم الجوال الموحد
    formatPhone(phone) {
        let p = phone.replace(/\D/g, ''); // حذف الرموز
        if (p.startsWith('05')) p = '966' + p.substring(1);
        else if (!p.startsWith('966')) p = '966' + p;
        return p;
    },

    // 6. تحديد حالة المريض (ألوان)
    getStatus(p) {
        if (p.type === 'order') {
            if (p.orderStatus === 'delivered') return { text: 'Delivered', color: 'status-ok' };
            if (p.orderStatus === 'pending') return { text: 'Pending', color: 'status-waiting' };
            return { text: 'Waiting', color: 'status-info' };
        }
        
        // Refill logic
        if (p.converted === 'yes') return { text: 'Converted', color: 'status-ok' };
        if (!p.reminderDate) return { text: 'No Date', color: 'status-waiting' };

        const today = new Date();
        today.setHours(0,0,0,0);
        const remDate = new Date(p.reminderDate);
        remDate.setHours(0,0,0,0);
        
        const diffTime = remDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'Overdue (' + Math.abs(diffDays) + 'd)', color: 'status-overdue' };
        if (diffDays <= 3) return { text: 'Soon (' + diffDays + 'd)', color: 'status-soon' };
        return { text: 'OK (' + diffDays + 'd)', color: 'status-ok' };
    },

    // 7. فتح الواتساب
    openWhatsapp(id) {
        // دالة بسيطة لفتح الرابط، المنطق الكامل موجود في PatientsModule
        console.log('Open WA for', id);
    },

    // 8. تنظيف النصوص (حماية)
    sanitize(str) {
        if (!str) return '';
        return str.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
};
