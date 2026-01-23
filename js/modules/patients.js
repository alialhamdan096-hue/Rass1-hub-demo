import { State, Config, Events } from '../core.js';
import { API } from '../api.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const PatientsModule = {
    init() {
        const form = document.getElementById('patientForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.save(e));
        }

        // ربط الأزرار (بما فيها الواتساب)
        window.setEntryType = (type) => this.setEntryType(type);
        window.resetForm = () => this.resetForm();
        
        window.PatientActions = {
            edit: (id) => this.loadForEdit(id),
            delete: (id) => UI.confirmDelete(id),
            
            // ✅ كود الواتساب رجع هنا
            whatsapp: (id) => {
                const p = State.patients.find(x => x.id === id);
                if (!p) return;
                
                let msg = '';
                if (p.type === 'refill') {
                    msg = `أهلاً ${p.name || 'بك'}،\nمعك صيدلية الرازي. نود تذكيرك بموعد إعادة صرف دواء ${p.med}.\nهل تود تجهيزه لك؟`;
                } else {
                    msg = `أهلاً ${p.name || 'بك'}،\nالطلب الخاص بك (${p.med}) وصل للصيدلية وجاهز للاستلام.`;
                }
                
                let phone = p.phone.replace(/\D/g, '');
                if (phone.startsWith('05')) phone = '966' + phone.substring(1);
                
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            },

            confirmArrived: (id) => UI.confirmArrived(id),
            markDelivered: (id) => UI.markDelivered(id)
        };

        const searchInput = document.getElementById('search');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                State.searchQuery = e.target.value.toLowerCase();
                this.render();
            });
        }
        
        ['typeFilter', 'statusFilter'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('change', (e) => {
                    State[id] = e.target.value;
                    this.render();
                });
            }
        });

        Events.on('data:loaded', () => this.render());
    },

    setEntryType(t) {
        State.entryType = t;
        const el = document.getElementById('entryType');
        if(el) el.value = t;
        
        document.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
            if(b.dataset.type === t) b.classList.add('active');
        });
        
        const medLabel = document.getElementById('medLabel');
        const medInput = document.getElementById('med');
        const submitBtn = document.getElementById('submitBtn');
        
        if(t === 'refill') {
            if(medLabel) medLabel.innerHTML = 'Medication <span class="required">*</span>';
            if(medInput) medInput.placeholder = 'Medication name';
            document.getElementById('refillFields').style.display = 'block';
            document.getElementById('orderFields').style.display = 'none';
            if(submitBtn) submitBtn.innerHTML = '<span>➕</span> Add Patient';
        } else {
            if(medLabel) medLabel.innerHTML = 'Item Name <span class="required">*</span>';
            if(medInput) medInput.placeholder = 'Product name';
            document.getElementById('refillFields').style.display = 'none';
            document.getElementById('orderFields').style.display = 'block';
            if(submitBtn) submitBtn.innerHTML = '<span>➕</span> Add Order';
        }
    },

    resetForm() {
        document.getElementById('patientForm').reset();
        State.editId = null;
        const ft = document.getElementById('formTitle');
        if(ft) ft.textContent = '➕ Add New';
        this.setEntryType('refill');
        
        const d = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('date');
        if(dateInput) dateInput.value = d;
        const daysInput = document.getElementById('days');
        if(daysInput) daysInput.value = 30;
    },

    async save(e) {
        e.preventDefault();
        const t = State.entryType;
        const phone = document.getElementById('phone').value;
        const med = document.getElementById('med').value;
        
        if (!phone || phone.length < 8) { UI.showToast('رقم الجوال مطلوب', 'error'); return; }
        if (!med) { UI.showToast('اسم الدواء مطلوب', 'error'); return; }

        let reminderDateVal = '';
        if(t === 'refill') {
            const dVal = document.getElementById('date').value;
            const daysVal = document.getElementById('days').value;
            if(dVal && daysVal) {
                const d = new Date(dVal);
                d.setDate(d.getDate() + parseInt(daysVal));
                reminderDateVal = d.toISOString().split('T')[0];
            }
        }

        const p = {
            id: State.editId || Date.now().toString(),
            type: t,
            name: document.getElementById('name').value,
            phone: phone,
            med: med,
            notes: document.getElementById('notes').value,
            addedDate: new Date().toISOString().split('T')[0],
            date: t === 'refill' ? document.getElementById('date').value : '',
            days: t === 'refill' ? document.getElementById('days').value : '',
            branch: t === 'order' ? document.getElementById('branch').value : '',
            pickupDate: t === 'order' ? document.getElementById('pickupDate').value : '',
            orderStatus: t === 'order' ? 'waiting' : '',
            reminderSent: 'no',
            reminderDate: reminderDateVal,
            converted: 'no',
            history: State.editId ? undefined : []
        };

        const success = await API.savePatient(p, State.editId ? 'update' : 'add');
        if (success) {
            UI.showToast(State.editId ? 'Updated!' : 'Added!', 'success');
            this.resetForm();
        }
    },

    loadForEdit(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        
        State.editId = id;
        this.setEntryType(p.type);
        
        document.getElementById('name').value = p.name;
        document.getElementById('phone').value = p.phone;
        document.getElementById('med').value = p.med;
        document.getElementById('notes').value = p.notes;
        document.getElementById('formTitle').textContent = '✏️ Edit Record';
        
        if (p.type === 'refill') {
            document.getElementById('date').value = p.date;
            document.getElementById('days').value = p.days;
        } else {
            document.getElementById('branch').value = p.branch;
            document.getElementById('pickupDate').value = p.pickupDate || '';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    render() {
        const tbody = document.getElementById('patientsTbody');
        if (!tbody) return;
        
        const list = State.patients.filter(p => {
            const matchSearch = (p.name+p.phone+p.med).toLowerCase().includes(State.searchQuery || '');
            const matchType = State.typeFilter === 'all' || p.type === State.typeFilter;
            return matchSearch && matchType;
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">No records found</td></tr>';
            const totalEl = document.getElementById('total');
            if(totalEl) totalEl.textContent = 0;
            return;
        }

        tbody.innerHTML = list.slice(0, Config.ITEMS_PER_PAGE).map(p => {
            let status = { text: 'Unknown', color: 'status-info' };
            try { if(Utils && Utils.getStatus) status = Utils.getStatus(p); } catch(e) {}

            const isOrder = p.type === 'order';
            
            // ✅ هنا رجعنا زر الواتساب
            let btns = '';
            
            if (isOrder) {
                // أزرار الطلبات
                if(p.orderStatus === 'waiting') btns += `<button class="arrived" onclick="PatientActions.confirmArrived('${p.id}')">📥</button>`;
                else if(p.orderStatus === 'pending') btns += `<button class="done" onclick="PatientActions.markDelivered('${p.id}')">✅</button>`;
            } else {
                // زر الواتساب للرفيل 💬
                btns += `<button class="wa" onclick="PatientActions.whatsapp('${p.id}')">💬</button>`; 
            }
            
            // أزرار التعديل والحذف للكل
            btns += `<button class="edit" onclick="PatientActions.edit('${p.id}')">✏️</button>`;
            btns += `<button class="del" onclick="PatientActions.delete('${p.id}')">🗑️</button>`;

            return `
                <tr class="${isOrder ? 'order-row' : ''}">
                    <td><span class="badge ${p.type}">${isOrder ? '📦' : '💊'}</span></td>
                    <td><div class="name">${p.name || '-'}</div><div class="phone">${p.phone}</div></td>
                    <td>${p.med}</td>
                    <td>${p.addedDate || '-'}</td>
                    <td>${isOrder ? (p.pickupDate || '-') : p.date}</td>
                    <td><span class="badge ${status.color}">${status.text}</span></td>
                    <td><div class="actions">${btns}</div></td>
                </tr>
            `;
        }).join('');
        
        const totalEl = document.getElementById('total');
        if(totalEl) totalEl.textContent = list.length;
    }
};
