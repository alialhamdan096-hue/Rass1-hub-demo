import { State, Config, Events } from '../core.js';
import { API } from '../api.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const PatientsModule = {
    init() {
        // 1. ربط زر الإضافة (Submit)
        const form = document.getElementById('patientForm');
        if (form) {
            // إزالة أي مستمعين سابقين لتجنب التكرار
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
            
            // إعادة ربط أزرار اختيار النوع (Refill / Order) داخل الفورم الجديد
            this.bindTypeSelectors();
        }

        // 2. ربط البحث والفلتر
        const searchInput = document.getElementById('search');
        const statusFilter = document.getElementById('statusFilter');
        const typeFilter = document.getElementById('typeFilter');

        if(searchInput) searchInput.addEventListener('input', (e) => {
            State.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        if(statusFilter) statusFilter.addEventListener('change', (e) => {
            State.statusFilter = e.target.value;
            this.render();
        });

        if(typeFilter) typeFilter.addEventListener('change', (e) => {
            State.typeFilter = e.target.value;
            this.render();
        });

        // 3. الاستماع لوصول البيانات من الشيت
        Events.on('data:loaded', () => this.render());
    },

    bindTypeSelectors() {
        // تفعيل أزرار التبديل بين Refill و Order
        const btns = document.querySelectorAll('.type-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                document.getElementById('entryType').value = type;
                
                // إخفاء/إظهار الحقول حسب النوع
                if(type === 'refill') {
                    document.getElementById('refillFields').style.display = 'block';
                    document.getElementById('orderFields').style.display = 'none';
                    document.getElementById('medLabel').innerHTML = 'Medication <span class="required">*</span>';
                } else {
                    document.getElementById('refillFields').style.display = 'none';
                    document.getElementById('orderFields').style.display = 'block';
                    document.getElementById('medLabel').innerHTML = 'Item Name <span class="required">*</span>';
                }
            });
        });
    },

    async save() {
        // 1. جمع البيانات من الخانات
        const id = State.editId || Date.now().toString();
        const type = document.getElementById('entryType').value;
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const med = document.getElementById('med').value;
        const notes = document.getElementById('notes').value;
        
        // بيانات خاصة بالرفيل
        const date = document.getElementById('date').value;
        const days = document.getElementById('days').value;
        
        // بيانات خاصة بالطلبات
        const branch = document.getElementById('branch').value;
        const pickupDateVal = document.getElementById('pickupDate').value;
        let pickupDate = pickupDateVal;
        if(pickupDateVal === 'custom') pickupDate = document.getElementById('customPickupDate').value;

        // 2. التحقق من البيانات (Validation)
        if (!phone.match(Config.PHONE_REGEX)) {
            UI.showToast('رقم الجوال غير صحيح (يجب أن يبدأ بـ 05 أو 9665)', 'error');
            return;
        }
        if (!med) {
            UI.showToast('فضلاً أدخل اسم الدواء', 'error');
            return;
        }
        if (type === 'refill' && !date) {
            UI.showToast('فضلاً اختر تاريخ الصرف', 'error');
            return;
        }
        if (type === 'order' && !branch) {
            UI.showToast('فضلاً اختر الفرع', 'error');
            return;
        }

        // 3. تجهيز الكائن
        const patient = {
            id, type, name, phone, med, notes,
            addedDate: Utils.getToday(),
            // حقول الرفيل
            date: type === 'refill' ? date : '',
            days: type === 'refill' ? days : '',
            // حقول الطلبات
            branch: type === 'order' ? branch : '',
            pickupDate: type === 'order' ? pickupDate : '',
            orderStatus: type === 'order' ? 'pending' : '',
            // حقول النظام
            reminderSent: 'no',
            reminderDate: type === 'refill' ? Utils.calcReminder(date, days) : '',
            converted: 'no',
            history: State.editId ? undefined : [] // لا نرسل الهيستوري عند التعديل البسيط
        };

        // 4. الإرسال
        const success = await API.savePatient(patient, State.editId ? 'update' : 'add');
        
        if (success) {
            UI.showToast(State.editId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح', 'success');
            this.resetForm();
        }
    },

    resetForm() {
        document.getElementById('patientForm').reset();
        State.editId = null;
        document.getElementById('formTitle').textContent = '➕ Add New';
        document.getElementById('submitBtn').innerHTML = '<span>➕</span> Add';
        // إعادة التاريخ لليوم
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('days').value = 30;
    },

    render() {
        const tbody = document.getElementById('patientsTbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        // تصفية البيانات
        let list = State.patients.filter(p => {
            const matchSearch = (p.name+p.phone+p.med).toLowerCase().includes(State.searchQuery);
            const matchType = State.typeFilter === 'all' || p.type === State.typeFilter;
            // فلتر الحالة يحتاج منطق معقد قليلاً، للتبسيط سنعرض الكل إذا لم يحدد
            return matchSearch && matchType;
        });

        // الباجنيشن (الصفحات)
        const start = (State.currentPage - 1) * Config.ITEMS_PER_PAGE;
        const paginated = list.slice(start, start + Config.ITEMS_PER_PAGE);

        if (paginated.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No records found</td></tr>';
            // تحديث العدادات بأصفار
            document.getElementById('total').textContent = 0;
            return;
        }

        // الرسم
        paginated.forEach(p => {
            const status = Utils.getStatus(p); // نفترض وجود دالة الحالة في Utils
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="badge ${p.type}">${p.type}</span></td>
                <td>${p.name || '-'}</td>
                <td>${p.med}</td>
                <td>${p.addedDate || '-'}</td>
                <td>${p.type === 'refill' ? p.date : '<small>Pickup: '+p.pickupDate+'</small>'}</td>
                <td><span class="status-dot ${status.color}"></span> ${status.text}</td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="window.PatientActions.edit('${p.id}')">✏️</button>
                        <button class="btn-icon delete" onclick="window.PatientActions.delete('${p.id}')">🗑️</button>
                        <button class="btn-icon whatsapp" onclick="window.PatientActions.whatsapp('${p.id}')">💬</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // تحديث العدادات العلوية
        document.getElementById('total').textContent = State.patients.length;
        
        // تعريف دوال الأزرار (Edit/Delete) للنوافذ
        window.PatientActions = {
            edit: (id) => this.loadForEdit(id),
            delete: (id) => UI.confirmDelete(id),
            whatsapp: (id) => Utils.openWhatsapp(id)
        };
    },

    loadForEdit(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;
        
        State.editId = id;
        document.getElementById('formTitle').textContent = '✏️ Edit Record';
        document.getElementById('submitBtn').innerHTML = '💾 Update';
        
        // تعبئة الخانات
        document.getElementById('entryType').value = p.type;
        document.getElementById('name').value = p.name;
        document.getElementById('phone').value = p.phone;
        document.getElementById('med').value = p.med;
        document.getElementById('notes').value = p.notes;
        
        if (p.type === 'refill') {
            document.querySelector('.type-btn.refill').click();
            document.getElementById('date').value = p.date;
            document.getElementById('days').value = p.days;
        } else {
            document.querySelector('.type-btn.order').click();
            document.getElementById('branch').value = p.branch;
        }
        
        // التمرير للأعلى
        document.querySelector('.container').scrollIntoView({behavior: 'smooth'});
    }
};
