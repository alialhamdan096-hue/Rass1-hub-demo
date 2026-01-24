import { State } from '../state.js';
import { UI } from '../components/ui.js';
import { Utils } from '../utils/helpers.js';
import { API } from '../api/sheets.js';

// ==================== PATIENT ACTIONS ====================
export const PatientActions = {
    renderCallback: null,
    trackingCallback: null,

    setCallbacks(render, tracking) {
        this.renderCallback = render;
        this.trackingCallback = tracking;
    },

    async save(e) {
        e.preventDefault();
        UI.clearFieldErrors();

        const t = State.entryType;
        const phone = document.getElementById('phone').value;
        const med = document.getElementById('med').value.trim();
        let valid = true;

        if (!Utils.validatePhone(phone)) { UI.showFieldError('phone', true); valid = false; }
        if (!med) { UI.showFieldError('med', true); valid = false; }

        if (t === 'refill') {
            if (!document.getElementById('date').value) { UI.showFieldError('date', true); valid = false; }
            const d = parseInt(document.getElementById('days').value);
            if (!d || d < 1 || d > 365) { UI.showFieldError('days', true); valid = false; }
        } else {
            if (!document.getElementById('branch').value) { UI.showFieldError('branch', true); valid = false; }
        }

        if (!valid) { UI.showToast('Please fix errors', 'error'); return; }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Saving...';

        let pk = '';
        if (t === 'order') {
            const pv = document.getElementById('pickupDate').value;
            if (pv === 'today') pk = Utils.getToday();
            else if (pv === 'tomorrow') pk = Utils.getTomorrow();
            else if (pv === 'custom') pk = document.getElementById('customPickupDate').value;
        }

        const p = {
            id: State.editId || Date.now().toString(),
            type: t,
            name: document.getElementById('name').value.trim(),
            phone: Utils.formatPhone(phone),
            med: med,
            date: t === 'refill' ? document.getElementById('date').value : '',
            days: t === 'refill' ? document.getElementById('days').value : '',
            notes: document.getElementById('notes').value.trim(),
            addedDate: State.editId ? null : Utils.getToday(),
            branch: t === 'order' ? document.getElementById('branch').value : '',
            pickupDate: pk,
            orderStatus: t === 'order' ? 'waiting' : '',
            arrivedDate: '',
            deliveredDate: '',
            reminderSent: 'no',
            reminderDate: '',
            converted: 'no',
            convertedDate: '',
            history: []
        };

        if (State.editId) {
            const x = State.patients.find(i => i.id === State.editId);
            p.addedDate = x.addedDate;
            p.orderStatus = x.orderStatus;
            p.arrivedDate = x.arrivedDate;
            p.deliveredDate = x.deliveredDate;
            p.reminderSent = x.reminderSent;
            p.reminderDate = x.reminderDate;
            p.converted = x.converted;
            p.convertedDate = x.convertedDate;
            p.history = x.history || [];
            State.patients[State.patients.findIndex(i => i.id === State.editId)] = p;
        } else {
            State.patients.push(p);
        }

        await API.savePatient(p, State.editId ? 'update' : 'add');
        UI.showToast(State.editId ? 'Updated!' : 'Added!', 'success');
        if (this.renderCallback) this.renderCallback();
        UI.updateOrdersBadge();
        window.resetForm();
        btn.disabled = false;
        btn.innerHTML = '<span>➕</span> Add ' + (t === 'refill' ? 'Patient' : 'Order');
    },

    edit(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        State.editId = id;
        window.setEntryType(p.type || 'refill');
        document.getElementById('name').value = p.name;
        document.getElementById('phone').value = p.phone;
        document.getElementById('med').value = p.med;
        document.getElementById('notes').value = p.notes || '';

        if (p.type === 'refill') {
            document.getElementById('date').value = p.date;
            document.getElementById('days').value = p.days;
        } else {
            document.getElementById('branch').value = p.branch;
            if (p.pickupDate === Utils.getToday()) document.getElementById('pickupDate').value = 'today';
            else if (p.pickupDate === Utils.getTomorrow()) document.getElementById('pickupDate').value = 'tomorrow';
            else if (p.pickupDate) {
                document.getElementById('pickupDate').value = 'custom';
                document.getElementById('customPickupDate').value = p.pickupDate;
                document.getElementById('customDateGroup').style.display = 'block';
            }
        }
        document.getElementById('formTitle').textContent = '✏️ Edit';
        document.getElementById('submitBtn').innerHTML = '<span>💾</span> Update';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    delete(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '🗑️',
            title: 'Delete',
            message: 'Delete "' + (p.name || p.phone) + '"?',
            confirmText: 'Delete',
            confirmClass: 'danger',
            onConfirm: async () => {
                State.patients = State.patients.filter(x => x.id !== id);
                await API.savePatient({ id }, 'delete');
                UI.showToast('Deleted!', 'success');
                if (this.renderCallback) this.renderCallback();
                UI.updateOrdersBadge();
            }
        });
    },

    confirmWhatsApp(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '📱',
            title: 'Send WhatsApp',
            message: 'Send reminder to "' + (p.name || p.phone) + '"?',
            confirmText: 'Send',
            confirmClass: 'success',
            onConfirm: () => this.sendRefillWhatsApp(id)
        });
    },

    sendRefillWhatsApp(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        const m = 'السلام عليكم ورحمة الله وبركاته\nصيدلية الرازي الرس 1 ترحب بكم\n\nهذا تذكير بموعد صرف الدواء الخاص بك:\n\nالدواء: ' + p.med + '\n\nنسعد بتجهيزه لكم عبر:\n\n- الاستلام من الصيدلية\n- التوصيل لموقعكم\n\n📍 موقع الصيدلية:\nhttps://shorturl.at/M2Cq3\n\nنتمنى لكم دوام الصحة والعافية';
        window.open('https://wa.me/' + p.phone + '?text=' + encodeURIComponent(m), '_blank');
        p.reminderSent = 'yes';
        p.reminderDate = Utils.getToday();
        API.savePatient(p, 'update');
        UI.showToast('WhatsApp opened!', 'success');
        if (this.renderCallback) this.renderCallback();
        if (this.trackingCallback) this.trackingCallback();
    },

    confirmArrived(id) {
        const p = State.patients.find(x => x.id === id);
        UI.showModal({
            icon: '📥',
            title: 'Order Arrived',
            message: 'Send WhatsApp to "' + (p.name || p.phone) + '"?',
            confirmText: 'Yes, Send',
            confirmClass: 'success',
            onConfirm: () => this.markArrived(id)
        });
    },

    async markArrived(id) {
        const p = State.patients.find(x => x.id === id);
        p.orderStatus = 'pending';
        p.arrivedDate = Utils.getToday();
        const m = 'السلام عليكم ورحمة الله وبركاته\nصيدلية الرازي الرس 1\n\nطلبكم جاهز للاستلام ✅\n\nالدواء: ' + p.med + '\n\n📍 موقع الصيدلية:\nhttps://shorturl.at/M2Cq3\n\nنسعد بخدمتكم';
        window.open('https://wa.me/' + p.phone + '?text=' + encodeURIComponent(m), '_blank');
        await API.savePatient(p, 'update');
        UI.showToast('WhatsApp opened!', 'success');
        if (this.renderCallback) this.renderCallback();
        UI.updateOrdersBadge();
    },

    async markDelivered(id) {
        const p = State.patients.find(x => x.id === id);
        p.orderStatus = 'delivered';
        p.deliveredDate = Utils.getToday();
        await API.savePatient(p, 'update');
        UI.showToast('Delivered!', 'success');
        if (this.renderCallback) this.renderCallback();
        UI.updateOrdersBadge();
    },

    async markConverted(id) {
        const p = State.patients.find(x => x.id === id);
        p.converted = 'yes';
        p.convertedDate = Utils.getToday();
        await API.savePatient(p, 'update');
        UI.showToast('Converted!', 'success');
        if (this.renderCallback) this.renderCallback();
        if (this.trackingCallback) this.trackingCallback();
    },

    async undoConverted(id) {
        const p = State.patients.find(x => x.id === id);
        p.converted = 'no';
        p.convertedDate = '';
        await API.savePatient(p, 'update');
        UI.showToast('Undone', 'info');
        if (this.trackingCallback) this.trackingCallback();
    },

    async renewPatient(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p.history) p.history = [];
        p.history.push({ date: p.date, reminderDate: p.reminderDate, convertedDate: p.convertedDate });
        p.date = Utils.getToday();
        p.reminderSent = 'no';
        p.reminderDate = '';
        p.converted = 'no';
        p.convertedDate = '';
        await API.savePatient(p, 'update');
        UI.showToast('Renewed!', 'success');
        if (this.renderCallback) this.renderCallback();
        if (this.trackingCallback) this.trackingCallback();
    }
};
