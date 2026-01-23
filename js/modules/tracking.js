import { State, Events } from '../core.js';
import { Utils } from '../utils.js';
import { API } from '../api.js';
import { UI } from './ui.js';
import { PatientsModule } from './patients.js';

export const TrackingModule = {
    init() {
        // الاستماع للأحداث
        Events.on('data:loaded', () => this.render());
        Events.on('tracking:update', () => this.render());
        
        // مستمع لفلتر التتبع
        const filterSelect = document.getElementById('trackFilter');
        if(filterSelect) {
            filterSelect.addEventListener('change', () => this.render());
        }
        
        // دمج هذه الدوال مع PatientActions عشان الأزرار في الـ HTML تقدر تشوفهم
        window.PatientActions = { 
            ...window.PatientActions, 
            markConverted: (id) => this.markConverted(id),
            undoConverted: (id) => this.undoConverted(id),
            renewPatient: (id) => this.renewPatient(id)
        };
    },

    markConverted(id){ 
        const p=State.patients.find(x=>x.id===id); 
        if(!p) return;
        p.converted='yes'; 
        p.convertedDate=Utils.getToday(); 
        API.savePatient(p,'update'); 
        UI.showToast('Converted!','success'); 
        this.render(); 
    },

    undoConverted(id){ 
        const p=State.patients.find(x=>x.id===id); 
        if(!p) return;
        p.converted='no'; 
        p.convertedDate=''; 
        API.savePatient(p,'update'); 
        UI.showToast('Undone','info'); 
        this.render(); 
    },

    async renewPatient(id){
        const p=State.patients.find(x=>x.id===id);
        if(!p) return;
        
        // أرشفة الدورة الحالية في التاريخ
        if(!p.history) p.history=[]; 
        p.history.push({
            date: p.date,
            reminderDate: p.reminderDate,
            convertedDate: p.convertedDate
        });
        
        // تصفير العداد للدورة الجديدة
        p.date = Utils.getToday(); 
        p.reminderSent = 'no'; 
        p.reminderDate = ''; 
        p.converted = 'no'; 
        p.convertedDate = '';
        
        await API.savePatient(p,'update'); 
        UI.showToast('Renewed!','success'); 
        
        // تحديث الواجهات
        PatientsModule.render(); 
        this.render();
    },

    render(){
        const fl = document.getElementById('trackFilter').value;
        
        // تصفية المرضى: نوع رفيل + تم إرسال تذكير
        let l = State.patients.filter(p => p.type === 'refill' && p.reminderSent === 'yes');
        
        if(fl === 'waiting') l = l.filter(p => p.converted !== 'yes'); 
        else if(fl === 'converted') l = l.filter(p => p.converted === 'yes');
        
        l.sort((a,b) => new Date(b.reminderDate) - new Date(a.reminderDate));
        
        // حساب الإحصائيات العامة (بما فيها الأرشيف)
        let ts=0, tc=0; 
        State.patients.filter(p => p.type === 'refill').forEach(p => { 
            if(p.reminderSent === 'yes') ts++; 
            if(p.converted === 'yes') tc++; 
            (p.history||[]).forEach(h => {
                if(h.reminderDate) ts++;
                if(h.convertedDate) tc++;
            }); 
        });
        
        document.getElementById('tSent').textContent = ts; 
        document.getElementById('tConverted').textContent = tc; 
        document.getElementById('tRate').textContent = ts > 0 ? Math.round(tc/ts*100)+'%' : '0%';
        
        const g = document.getElementById('trackGrid');
        if(l.length === 0){
            g.innerHTML = '<div class="empty" style="grid-column:1/-1">No records</div>';
            return;
        }
        
        g.innerHTML = l.map(p => {
            const hc = (p.history||[]).length; 
            const hb = hc > 0 ? '<div class="history-badge">🔄 '+hc+'</div>' : '';
            
            if(p.converted === 'yes') {
                return `
                <div class="track-card converted">
                    ${hb}
                    <div class="name">${Utils.sanitize(p.name)}</div>
                    <div class="med">${Utils.sanitize(p.med)}</div>
                    <div class="info">📤 ${p.reminderDate}<br>✅ ${p.convertedDate}</div>
                    <button class="track-btn done" onclick="PatientActions.undoConverted('${p.id}')">✅ Converted (Undo)</button>
                    <button class="track-btn renew" onclick="PatientActions.renewPatient('${p.id}')">🔄 Renew</button>
                </div>`;
            } else {
                return `
                <div class="track-card">
                    ${hb}
                    <div class="name">${Utils.sanitize(p.name)}</div>
                    <div class="med">${Utils.sanitize(p.med)}</div>
                    <div class="info">📤 ${p.reminderDate}</div>
                    <button class="track-btn" onclick="PatientActions.markConverted('${p.id}')">✅ Mark Converted</button>
                </div>`;
            }
        }).join('');
    }
};
