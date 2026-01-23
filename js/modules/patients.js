import { State, Config, Events } from '../core.js';
import { API } from '../api.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';

export const PatientsModule = {
    init() {
        // 1. ربط فورم الإضافة
        const form = document.getElementById('patientForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', (e) => this.save(e));
        }

        // 2. الحارس الذكي (يحل مشكلة الأزرار اللي ما تنضغط) 🛡️
        const tbody = document.getElementById('patientsTbody');
        if (tbody) {
            const newTbody = tbody.cloneNode(true); // استنساخ نظيف
            tbody.parentNode.replaceChild(newTbody, tbody);
            
            // مراقبة أي ضغطة داخل الجدول
            newTbody.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action === 'edit') this.loadForEdit(id);
                else if (action === 'delete') UI.confirmDelete(id);
                else if (action === 'whatsapp') this.openWhatsapp(id); // 👈 هنا استدعاء الواتس
                else if (action === 'arrived') UI.confirmArrived(id);
                else if (action === 'delivered') UI.markDelivered(id);
                else if (action === 'rate') this.showRatingModal(id);
            });
        }

        // 3. دوال مساعدة
        window.setEntryType = (type) => this.setEntryType(type);
        window.resetForm = () => this.resetForm();

        // 4. البحث والفلتر
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

        // 5. الاستماع لوصول البيانات
        Events.on('data:loaded', () => this.render());
    },

    // ✅ دالة الواتساب (تم إصلاح خطأ p.phone.replace) 🔧
    openWhatsapp(id) {
        // تحويل id لنص للمقارنة الآمنة
        const p = State.patients.find(x => String(x.id) === String(id));
        if (!p) { UI.showToast('لم يتم العثور على البيانات', 'error'); return; }

        let msg = '';
        if (p.type === 'refill') {
            msg = `أهلاً ${p.name || 'بك'}،\nمعك صيدلية الرازي. نود تذكيرك بموعد إعادة صرف دواء ${p.med}.\nهل تود تجهيزه لك؟`;
        } else {
            msg = `أهلاً ${p.name || 'بك'}،\nالطلب الخاص بك (${p.med}) وصل للصيدلية وجاهز للاستلام.`;
        }

        // ⚠️ هنا الإصلاح: String(p.phone) يجبر الرقم يصير نص
        let phone = String(p.phone).replace(/\D/g, '');
        if (phone.startsWith('05')) phone = '966' + phone.substring(1);

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    },

    // ⭐ دالة التقييم
    async showRatingModal(id) {
        const p = State.patients.find(x => String(x.id) === String(id));
        if (!p) { UI.showToast('لم يتم العثور على البيانات', 'error'); return; }

        // إنشاء نافذة التقييم
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-icon">⭐</div>
                <div class="modal-title">تقييم الخدمة</div>
                <div class="modal-message">كيف كانت تجربتك مع ${p.name || 'العميل'}؟</div>
                <div class="rating-stars" id="modalRatingStars" style="justify-content: center; margin: 20px 0; font-size: 32px;">
                    ${[1,2,3,4,5].map(i => `<span class="star ${p.rating >= i ? 'filled' : ''}" data-rating="${i}">⭐</span>`).join('')}
                </div>
                <div class="modal-actions">
                    <button class="modal-cancel" id="cancelRating">إلغاء</button>
                    <button class="modal-confirm success" id="confirmRating">تأكيد</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        let selectedRating = p.rating || 0;

        // التعامل مع النجوم
        const stars = modal.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                stars.forEach((s, idx) => {
                    s.classList.toggle('filled', idx < selectedRating);
                });
            });
        });

        // زر الإلغاء
        modal.querySelector('#cancelRating').addEventListener('click', () => {
            modal.remove();
        });

        // زر التأكيد
        modal.querySelector('#confirmRating').addEventListener('click', async () => {
            if (selectedRating === 0) {
                UI.showToast('الرجاء اختيار تقييم', 'warning');
                return;
            }

            p.rating = selectedRating;
            const success = await API.savePatient(p, 'update');
            if (success) {
                UI.showToast(`تم التقييم بـ ${selectedRating} نجوم!`, 'success');
                modal.remove();
            }
        });
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
        const di = document.getElementById('date'); if(di) di.value = d;
        const dy = document.getElementById('days'); if(dy) dy.value = 30;
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
            rating: 0,
            history: State.editId ? undefined : []
        };

        const success = await API.savePatient(p, State.editId ? 'update' : 'add');
        if (success) {
            UI.showToast(State.editId ? 'Updated!' : 'Added!', 'success');
            this.resetForm();
        }
    },

    loadForEdit(id) {
        const p = State.patients.find(x => String(x.id) === String(id));
        if (!p) { UI.showToast('السجل غير موجود', 'error'); return; }
        
        State.editId = String(id);
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
        
        const ft = document.getElementById('formTitle');
        if(ft) ft.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    render() {
        const tbody = document.getElementById('patientsTbody');
        if (!tbody) return;
        
        // إعادة ربط الحارس (مهم جداً عند إعادة الرسم)
        const newTbody = tbody.cloneNode(false);
        tbody.parentNode.replaceChild(newTbody, tbody);
        newTbody.id = 'patientsTbody';
        
        newTbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === 'edit') this.loadForEdit(id);
            else if (action === 'delete') UI.confirmDelete(id);
            else if (action === 'whatsapp') this.openWhatsapp(id);
            else if (action === 'arrived') UI.confirmArrived(id);
            else if (action === 'delivered') UI.markDelivered(id);
            else if (action === 'rate') this.showRatingModal(id);
        });

        const list = State.patients.filter(p => {
            const matchSearch = (p.name+p.phone+p.med).toLowerCase().includes(State.searchQuery || '');
            const matchType = State.typeFilter === 'all' || p.type === State.typeFilter;
            return matchSearch && matchType;
        });

        if (list.length === 0) {
            newTbody.innerHTML = '<tr><td colspan="8" class="empty">No records found</td></tr>';
            const totalEl = document.getElementById('total');
            if(totalEl) totalEl.textContent = 0;
            const avgRatingEl = document.getElementById('avgRating');
            if (avgRatingEl) avgRatingEl.textContent = '-';
            return;
        }

        newTbody.innerHTML = list.slice(0, Config.ITEMS_PER_PAGE).map(p => {
            let status = { text: 'Unknown', color: 'status-info' };
            try { if(Utils && Utils.getStatus) status = Utils.getStatus(p); } catch(e) {}
            const isOrder = p.type === 'order';
            
            // عرض التقييم
            const ratingDisplay = p.rating > 0
                ? `<div class="rating-display">${'⭐'.repeat(p.rating)}<span class="rating-value">${p.rating}/5</span></div>`
                : '<span style="color:#999;font-size:11px;">لم يتم التقييم</span>';

            let btns = '';
            // استخدام data-action و data-id هو الحل السحري للأزرار
            if (isOrder) {
                if(p.orderStatus === 'waiting') btns += `<button class="arrived" data-action="arrived" data-id="${p.id}">📥</button>`;
                else if(p.orderStatus === 'pending') btns += `<button class="done" data-action="delivered" data-id="${p.id}">✅</button>`;
            } else {
                btns += `<button class="wa" data-action="whatsapp" data-id="${p.id}">💬</button>`;
            }
            btns += `<button class="rating-btn" data-action="rate" data-id="${p.id}" title="تقييم الخدمة">⭐</button>`;
            btns += `<button class="edit" data-action="edit" data-id="${p.id}">✏️</button>`;
            btns += `<button class="del" data-action="delete" data-id="${p.id}">🗑️</button>`;

            return `
                <tr class="${isOrder ? 'order-row' : ''}">
                    <td><span class="badge ${p.type}">${isOrder ? '📦' : '💊'}</span></td>
                    <td><div class="name">${p.name || '-'}</div><div class="phone">${p.phone}</div></td>
                    <td>${p.med}</td>
                    <td>${p.addedDate || '-'}</td>
                    <td>${isOrder ? (p.pickupDate || '-') : p.date}</td>
                    <td><span class="badge ${status.color}">${status.text}</span></td>
                    <td>${ratingDisplay}</td>
                    <td><div class="actions">${btns}</div></td>
                </tr>
            `;
        }).join('');

        const totalEl = document.getElementById('total');
        if(totalEl) totalEl.textContent = list.length;

        // حساب متوسط التقييم
        const ratedPatients = State.patients.filter(p => p.rating > 0);
        if (ratedPatients.length > 0) {
            const avgRating = (ratedPatients.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedPatients.length).toFixed(1);
            const avgRatingEl = document.getElementById('avgRating');
            if (avgRatingEl) avgRatingEl.textContent = avgRating;
        } else {
            const avgRatingEl = document.getElementById('avgRating');
            if (avgRatingEl) avgRatingEl.textContent = '-';
        }
    }
};
