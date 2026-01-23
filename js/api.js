import { Config, State, Events } from './core.js';
import { UI } from './modules/ui.js';

export const API = {
    // جلب البيانات من الشيت
    async loadPatients() {
        UI.showLoading(true);
        try {
            // إضافة وقت عشوائي لمنع الكاش
            const response = await fetch(`${Config.API_URL}?action=get&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // ترتيب البيانات: الأحدث في الأعلى
            State.patients = data.reverse();
            
            // تبليغ النظام أن البيانات وصلت
            Events.emit('data:loaded', State.patients);
            
            // تحديث عداد الطلبات المعلقة
            const pendingOrders = State.patients.filter(p => p.type === 'order' && p.orderStatus !== 'delivered').length;
            Events.emit('orders:badge', pendingOrders);

        } catch (error) {
            console.error('Error loading data:', error);
            UI.showToast('فشل في جلب البيانات: ' + error.message, 'error');
        } finally {
            UI.showLoading(false);
        }
    },

    // حفظ، تعديل، أو حذف
    async savePatient(patientData, action = 'add') {
        UI.showLoading(true);
        
        // تجهيز البيانات للإرسال
        const payload = {
            action: action,
            data: JSON.stringify(patientData),
            id: action === 'delete' ? patientData : undefined
        };

        // تحويل البيانات لشكل يقبله قوقل سكربت
        const formData = new FormData();
        for (const key in payload) {
            if (payload[key] !== undefined) {
                formData.append(key, payload[key]);
            }
        }

        try {
            const response = await fetch(Config.API_URL, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success' || result.status === 'updated' || result.status === 'deleted') {
                // تحديث ناجح، نعيد تحميل البيانات لنرى التغيير
                await this.loadPatients();
                return true;
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.error('Save error:', error);
            UI.showToast('حدث خطأ أثناء الحفظ', 'error');
            return false;
        } finally {
            UI.showLoading(false);
        }
    }
};
