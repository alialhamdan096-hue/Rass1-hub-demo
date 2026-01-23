import { Config, State, Events } from './core.js';
import { UI } from './modules/ui.js';

export const API = {
    // جلب البيانات
    async loadPatients() {
        UI.showLoading(true);
        try {
            // إضافة وقت عشوائي لمنع الكاش
            const response = await fetch(`${Config.API_URL}?action=get&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            // 🛠️ الإصلاح السحري: تحويل النصوص إلى مصفوفات
            State.patients = data.reverse().map(p => {
                // معالجة الهيستوري (تحويل من نص إلى قائمة)
                let parsedHistory = [];
                try {
                    if (typeof p.history === 'string' && p.history.trim() !== '') {
                        parsedHistory = JSON.parse(p.history);
                    } else if (Array.isArray(p.history)) {
                        parsedHistory = p.history;
                    }
                } catch (e) {
                    console.warn('History parse error', p.history);
                }

                return {
                    ...p,
                    // التأكد أن هذه القيم موجودة دائماً
                    history: parsedHistory,
                    converted: p.converted || 'no',
                    reminderSent: p.reminderSent || 'no',
                    rating: parseInt(p.rating) || 0
                };
            });
            
            // تبليغ النظام أن البيانات وصلت جاهزة ونظيفة
            Events.emit('data:loaded', State.patients);
            
            // تحديث عداد الطلبات
            const pendingOrders = State.patients.filter(p => p.type === 'order' && p.orderStatus !== 'delivered').length;
            Events.emit('orders:badge', pendingOrders);

        } catch (error) {
            console.error('Error loading data:', error);
            UI.showToast('فشل في جلب البيانات: ' + error.message, 'error');
        } finally {
            UI.showLoading(false);
        }
    },

    // حفظ البيانات
    async savePatient(patientData, action = 'add') {
        UI.showLoading(true);
        
        // تجهيز البيانات
        const payload = {
            action: action,
            data: JSON.stringify(patientData),
            id: action === 'delete' ? patientData.id : undefined // إصلاح صغير هنا أيضاً
        };

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
            
            if (result.status === 'success' || result.status === 'updated' || result.status === 'deleted' || result.status === 'updated (new)') {
                await this.loadPatients(); // إعادة التحميل لرؤية التغيير
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
