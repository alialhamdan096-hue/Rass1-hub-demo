import { State, Config, Events } from '../core.js';
import { Utils } from '../utils.js';
import { UI } from './ui.js';
import { API } from '../api.js';

// أيقونة الواتساب
const WA_ICON = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

export const PatientsModule = {
    init() {
        // Expose actions to global window so HTML buttons can see them
        window.PatientActions = this; 
        window.Utils = Utils; // Also expose Utils

        // Listeners
        Events.on('data:loaded', () => this.render());
        document.getElementById('patientForm').addEventListener('submit', (e) => this.save(e));
        
        document.getElementById('search').addEventListener('input', Utils.debounce(e => {
            State.searchQuery = e.target.value;
            State.currentPage = 1;
            this.render();
        }, Config.SEARCH_DELAY));

        // Filters listeners
        document.getElementById('typeFilter').addEventListener('change', e => { State.typeFilter=e.target.value; State.currentPage=1; this.render(); });
        document.getElementById('statusFilter').addEventListener('change', e => { State.statusFilter=e.target.value; State.currentPage=1; this.render(); });
        
        // Type selector logic
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const t = btn.dataset.type;
                window.setEntryType(t); // We will define this globally too or move logic here
            });
        });
        
        // Setup initial form state helper
        window.setEntryType = (t) => {
            State.entryType=t;
            document.getElementById('entryType').value=t;
            document.querySelectorAll('.type-btn').forEach(b=>{
                b.classList.remove('active');
                if(b.dataset.type===t)b.classList.add('active');
            });
            const medLabel = document.getElementById('medLabel');
            const medInput = document.getElementById('med');
            if(t === 'refill') {
                medLabel.innerHTML = 'Medication <span class="required">*</span>';
                medInput.placeholder = 'Medication name';
            } else {
                medLabel.innerHTML = 'Item Name <span class="required">*</span>';
                medInput.placeholder = 'Product or Item name';
            }
            document.getElementById('refillFields').style.display=t==='refill'?'block':'none';
            document.getElementById('orderFields').style.display=t==='order'?'block':'none';
            document.getElementById('submitBtn').innerHTML='<span>➕</span> Add '+(t==='refill'?'Patient':'Order');
            UI.clearFieldErrors();
        };

        window.resetForm = () => {
            State.editId=null;
            document.getElementById('patientForm').reset();
            document.getElementById('days').value='30';
            document.getElementById('date').valueAsDate=new Date();
            document.getElementById('formTitle').textContent='➕ Add New';
            document.getElementById('submitBtn').innerHTML='<span>➕</span> Add '+(State.entryType==='refill'?'Patient':'Order');
            UI.clearFieldErrors();
        };

        window.changePage = (p) => { State.currentPage=p; this.render(); };
    },

    render() {
        // ... (نفس منطق renderPatients من الكود الأصلي) ...
        // ملاحظة: اختصرت الكود هنا، لكن يجب أن تنسخ محتوى دالة renderPatients
        // وتضعها هنا، مع استبدال window.PatientActions بـ PatientActions
        
        // سأضع لك الهيكل الأساسي للنسخ:
        const s=State.searchQuery.toLowerCase(), tf=State.typeFilter, sf=State.statusFilter;
        let f=State.patients.filter(p=>{
             // ... منطق الفلترة (انسخه من الكود القديم)
             const ms=p.name.toLowerCase().includes(s)||p.med.toLowerCase().includes(s)||p.phone.includes(s);
             if(!ms)return false;
             if(tf!=='all'&&p.type!==tf)return false;
             // ... اكمل النسخ
             return true;
        });

        // ... منطق الفرز والعد (Stats) ...
        
        // ... منطق رسم الجدول (innerHTML) ...
        const tb=document.getElementById('patientsTbody');
        // عند بناء الـ HTML، الأزرار ستعمل لأننا ربطنا window.PatientActions = this
        
        this.renderPagination(Math.ceil(f.length/Config.ITEMS_PER_PAGE), f.length);
        this.checkTodayAlerts();
    },

    renderPagination(tp, ti) {
         // ... (انسخ دالة renderPagination)
         const pg=document.getElementById('pagination');
         if(tp<=1){pg.innerHTML='';return}
         let h='';
         // ...
         pg.innerHTML=h;
    },

    checkTodayAlerts() {
        // ... (انسخ دالة checkTodayAlerts)
    },

    async save(e) {
        e.preventDefault();
        // ... (انسخ منطق الحفظ من PatientActions.save)
        // في النهاية استدع: this.render();
    },

    edit(id) {
        // ... (انسخ منطق PatientActions.edit)
    },

    delete(id) {
         const p=State.patients.find(x=>x.id===id);
         UI.showModal({
            title:'Delete',
            message:'Delete "'+(p.name || p.phone)+'"?',
            confirmClass:'danger',
            onConfirm:async()=>{
                State.patients=State.patients.filter(x=>x.id!==id);
                await API.savePatient({id},'delete');
                UI.showToast('Deleted!','success');
                this.render();
            }
        });
    },
    
    // ... باقي دوال WhatsApp, MarkArrived, etc.. انسخها هنا
    sendRefillWhatsApp(id) {
         // ...
    },
    confirmWhatsApp(id){
        // ...
        UI.showModal({
            title: 'WhatsApp',
            message: 'Send reminder?',
            confirmClass: 'success',
            onConfirm: () => this.sendRefillWhatsApp(id)
        });
    }
};
