import { State, Config, Events } from '../core.js';
import { API } from '../api.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const PatientsModule = {
    init() {
        // 1. ربط الفورم
        const form = document.getElementById('patientForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.save(e));
        }

        // 2. الجسر المهم جداً (ربط الدوال بـ Window) ⚠️
        // هذا السطر هو اللي يخلي زر HTML يشوف الكود حقنا
        window.setEntryType = (type) => this.setEntryType(type);
        window.resetForm = () => this.resetForm();
        window.PatientActions = {
            edit: (id) => this.loadForEdit(id),
            delete: (id) => UI.confirmDelete(id),
            whatsapp: (id) => Utils.openWhatsapp(id),
            confirmArrived: (id) => UI.confirmArrived(id),
            markDelivered: (id) => UI.markDelivered(id)
        };

        // 3. مستمعات الأحداث
        document.getElementById('search').addEventListener('input', (e) => {
            State.searchQuery = e.target.value.toLowerCase();
            this.render();
        });
        
        ['typeFilter', 'statusFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                State[id] = e.target.value;
                this.render();
            });
        });

        Events.on('data:loaded', () => this.render());
    },

    setEntryType(t) {
        State.entryType = t;
        document.getElementById('entryType').value = t;
        
        // تبديل الأزرار
        document.querySelectorAll('.type-btn').forEach(b => {
            b.classList.remove('active');
            if(b.dataset.type === t) b.classList.add('active');
        });
        
        // تبديل العناوين والخانات
        const medLabel = document.getElementById('medLabel');
        const medInput = document.getElementById('med');
        const submitBtn = document.getElementById('submitBtn');
        
        if(t === 'refill') {
            medLabel.innerHTML = 'Medication <span class="required">*</span>';
            medInput.placeholder = 'Medication name';
            document.getElementById('refillFields').style.display = 'block';
            document.getElementById('orderFields').style.display = 'none';
            if(submitBtn) submitBtn.innerHTML = '<span>➕</span> Add Patient';
        } else {
            medLabel.innerHTML = 'Item Name <span class="required">*</span>';
            medInput.placeholder = 'Product name';
            document.getElementById('refillFields').style.display = 'none';
            document.getElementById('orderFields').style.display = 'block';
            if(submitBtn) submitBtn.innerHTML = '<span>➕</span> Add Order';
        }
    },

    resetForm() {
        document.getElementById('patientForm').reset();
        State.editId = null;
        document.getElementById('formTitle').textContent = '➕ Add New';
        this.setEntryType('refill'); // إعادة للوضع الافتراضي
        
        // إعادة التاريخ لليوم
        const d = new Date().toISOString().split('T')[0];
        if(document.getElementById('date')) document.getElementById('date').value = d;
        document.getElementById('days').value = 30;
    },

    async save(e) {
        e.preventDefault();
        const t = State.entryType;
        const phone = document.getElementById('phone').value;
        const med = document.getElementById('med').value;
        
        // تحقق سريع
        if (!Utils.validatePhone(phone)) { UI.showToast('رقم الجوال غير صحيح', 'error'); return; }
        if (!med) { UI.showToast('أدخل اسم الدواء/الصنف', 'error'); return; }

        const p = {
            id: State.editId || Date.now().toString(),
            type: t,
            name: document.getElementById('name').value,
            phone: Utils.formatPhone(phone),
            med: med,
            notes: document.getElementById('notes').value,
            addedDate: Utils.getToday(),
            // Refill Data
            date: t === 'refill' ? document.getElementById('date').value : '',
            days: t === 'refill' ? document.getElementById('days').value : '',
            // Order Data
            branch: t === 'order' ? document.getElementById('branch').value : '',
            pickupDate: t === 'order' ? document.getElementById('pickupDate').value : '',
            orderStatus: t === 'order' ? 'waiting' : '',
            // System
            reminderSent: 'no',
            converted: 'no',
            history: State.editId ? undefined : []
        };

        if (t === 'refill') p.reminderDate = Utils.calcReminder(p.date, p.days);

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
        this.setEntryType(p.type); // تبديل الواجهة لنوع المريض
        
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
        
        // الفلتر والبحث
        const list = State.patients.filter(p => {
            const matchSearch = (p.name+p.phone+p.med).toLowerCase().includes(State.searchQuery);
            const matchType = State.typeFilter === 'all' || p.type === State.typeFilter;
            return matchSearch && matchType;
        });

        // التحديث (HTML Generation)
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty">No records found</td></tr>';
            document.getElementById('total').textContent = 0;
            return;
        }

        tbody.innerHTML = list.slice(0, Config.ITEMS_PER_PAGE).map(p => {
            const status = Utils.getStatus(p);
            const isOrder = p.type === 'order';
            
            // أزرار الإجراءات
            let btns = '';
            if (isOrder) {
               if(p.orderStatus === 'waiting') btns = `<button class="arrived" onclick="PatientActions.confirmArrived('${p.id}')">📥</button>`;
               else if(p.orderStatus === 'pending') btns = `<button class="done" onclick="PatientActions.markDelivered('${p.id}')">✅</button>`;
            } else {
               btns = `<button class="wa" onclick="PatientActions.whatsapp('${p.id}')">💬</button>`; 
            }
            btns += `<button class="edit" onclick="PatientActions.edit('${p.id}')">✏️</button>`;
            btns += `<button class="del" onclick="PatientActions.delete('${p.id}')">🗑️</button>`;

            return `
                <tr class="${isOrder ? 'order-row' : ''}">
                    <td><span class="badge ${p.type}">${isOrder ? '📦' : '💊'}</span></td>
                    <td><div class="name">${Utils.sanitize(p.name)}</div><div class="phone">${p.phone}</div></td>
                    <td>${Utils.sanitize(p.med)}</td>
                    <td>${p.addedDate}</td>
                    <td>${isOrder ? (p.pickupDate || '-') : p.date}</td>
                    <td><span class="badge ${status.color}">${status.text}</span></td>
                    <td><div class="actions">${btns}</div></td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('total').textContent = list.length;
    }
};
