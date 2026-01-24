// ==================== EXCEL EXPORT MODULE ====================
import * as XLSX from 'xlsx';
import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';
import { UI } from '../components/ui.js';

export const ExcelExport = {
    // Export all patients data
    exportAll() {
        if (State.patients.length === 0) {
            UI.showAlert('❌ لا توجد بيانات للتصدير');
            return;
        }

        const data = State.patients.map(p => this.formatPatientRow(p));
        this.downloadExcel(data, 'جميع_البيانات');
        UI.showAlert('✅ تم تصدير جميع البيانات');
    },

    // Export only refills
    exportRefills() {
        const refills = State.patients.filter(p => p.type === 'refill');
        if (refills.length === 0) {
            UI.showAlert('❌ لا توجد إعادة تعبئة للتصدير');
            return;
        }

        const data = refills.map(p => ({
            'الاسم': p.name,
            'رقم الجوال': p.phone,
            'الدواء': p.med,
            'عدد الأيام': p.days,
            'تاريخ التسجيل': p.date,
            'تاريخ التذكير': Utils.getRefillDate(p),
            'الأيام المتبقية': Utils.getDaysUntilRefill(p),
            'الحالة': this.getStatusArabic(p),
            'ملاحظات': p.notes || ''
        }));

        this.downloadExcel(data, 'إعادة_التعبئة');
        UI.showAlert('✅ تم تصدير بيانات إعادة التعبئة');
    },

    // Export only orders
    exportOrders() {
        const orders = State.patients.filter(p => p.type === 'order');
        if (orders.length === 0) {
            UI.showAlert('❌ لا توجد طلبات للتصدير');
            return;
        }

        const data = orders.map(p => ({
            'الاسم': p.name,
            'رقم الجوال': p.phone,
            'المنتج': p.med,
            'تاريخ الاستلام': p.pickupDate,
            'حالة الطلب': this.getOrderStatusArabic(p.orderStatus),
            'تاريخ التسجيل': p.date,
            'ملاحظات': p.notes || ''
        }));

        this.downloadExcel(data, 'الطلبات');
        UI.showAlert('✅ تم تصدير بيانات الطلبات');
    },

    // Export current filtered view
    exportFiltered() {
        let filtered = [...State.patients];

        // Apply search filter
        if (State.searchQuery) {
            const q = State.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.phone.includes(q) ||
                p.med.toLowerCase().includes(q)
            );
        }

        // Apply type filter
        if (State.typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type === State.typeFilter);
        }

        // Apply status filter
        if (State.statusFilter !== 'all') {
            if (State.statusFilter === 'pending') {
                filtered = filtered.filter(p => p.type === 'order' && p.orderStatus === 'pending');
            } else if (State.statusFilter === 'delivered') {
                filtered = filtered.filter(p => p.type === 'order' && p.orderStatus === 'delivered');
            } else if (State.statusFilter === 'overdue') {
                filtered = filtered.filter(p => p.type === 'refill' && Utils.getDaysUntilRefill(p) < 0);
            } else if (State.statusFilter === 'upcoming') {
                filtered = filtered.filter(p => p.type === 'refill' && Utils.getDaysUntilRefill(p) >= 0 && Utils.getDaysUntilRefill(p) <= 7);
            }
        }

        if (filtered.length === 0) {
            UI.showAlert('❌ لا توجد بيانات مطابقة للفلتر');
            return;
        }

        const data = filtered.map(p => this.formatPatientRow(p));
        this.downloadExcel(data, 'البيانات_المفلترة');
        UI.showAlert('✅ تم تصدير البيانات المفلترة (' + filtered.length + ' سجل)');
    },

    // Export monthly report
    exportMonthlyReport(month, year) {
        const refills = State.patients.filter(p => {
            if (p.type !== 'refill') return false;
            const refillDate = new Date(Utils.getRefillDate(p));
            return refillDate.getMonth() === month && refillDate.getFullYear() === year;
        });

        const orders = State.patients.filter(p => {
            if (p.type !== 'order') return false;
            const d = new Date(p.pickupDate);
            return d.getMonth() === month && d.getFullYear() === year;
        });

        const wb = XLSX.utils.book_new();

        // Refills sheet
        if (refills.length > 0) {
            const refillData = refills.map(p => ({
                'الاسم': p.name,
                'رقم الجوال': p.phone,
                'الدواء': p.med,
                'تاريخ التذكير': Utils.getRefillDate(p),
                'الحالة': this.getStatusArabic(p)
            }));
            const ws1 = XLSX.utils.json_to_sheet(refillData);
            XLSX.utils.book_append_sheet(wb, ws1, 'إعادة التعبئة');
        }

        // Orders sheet
        if (orders.length > 0) {
            const orderData = orders.map(p => ({
                'الاسم': p.name,
                'رقم الجوال': p.phone,
                'المنتج': p.med,
                'تاريخ الاستلام': p.pickupDate,
                'حالة الطلب': this.getOrderStatusArabic(p.orderStatus)
            }));
            const ws2 = XLSX.utils.json_to_sheet(orderData);
            XLSX.utils.book_append_sheet(wb, ws2, 'الطلبات');
        }

        // Summary sheet
        const summaryData = [{
            'الشهر': this.getMonthName(month) + ' ' + year,
            'إجمالي إعادة التعبئة': refills.length,
            'إجمالي الطلبات': orders.length,
            'الطلبات المسلمة': orders.filter(o => o.orderStatus === 'delivered').length,
            'الطلبات المعلقة': orders.filter(o => o.orderStatus === 'pending').length
        }];
        const ws3 = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws3, 'الملخص');

        const fileName = `تقرير_${this.getMonthName(month)}_${year}.xlsx`;
        XLSX.writeFile(wb, fileName);
        UI.showAlert('✅ تم تصدير التقرير الشهري');
    },

    // Helper: Format patient row for export
    formatPatientRow(p) {
        return {
            'النوع': p.type === 'refill' ? 'إعادة تعبئة' : 'طلب',
            'الاسم': p.name,
            'رقم الجوال': p.phone,
            'الدواء/المنتج': p.med,
            'عدد الأيام': p.type === 'refill' ? p.days : '-',
            'تاريخ التسجيل': p.date,
            'تاريخ التذكير/الاستلام': p.type === 'refill' ? Utils.getRefillDate(p) : p.pickupDate,
            'الحالة': p.type === 'refill' ? this.getStatusArabic(p) : this.getOrderStatusArabic(p.orderStatus),
            'ملاحظات': p.notes || ''
        };
    },

    // Helper: Get status in Arabic
    getStatusArabic(p) {
        const days = Utils.getDaysUntilRefill(p);
        if (days < 0) return 'متأخر';
        if (days === 0) return 'اليوم';
        if (days <= 7) return 'قريب';
        return 'نشط';
    },

    // Helper: Get order status in Arabic
    getOrderStatusArabic(status) {
        const statusMap = {
            'pending': 'معلق',
            'delivered': 'تم التسليم',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    },

    // Helper: Get month name in Arabic
    getMonthName(month) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months[month];
    },

    // Helper: Download Excel file
    downloadExcel(data, fileName) {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

        // Auto-width columns
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `${fileName}_${Utils.getToday()}.xlsx`);
    },

    // Show export options modal
    showExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Close export modal
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
};
