import { State, Config } from '../core.js';
import { Utils } from '../utils.js';

export const ReportsModule = {
    init() {
        // تعبئة قوائم الشهر والسنة
        const ms = document.getElementById('reportMonth'); 
        const ys = document.getElementById('reportYear'); 
        const cd = new Date();
        
        if(ms && ys) {
            Config.MONTHS.forEach((m,i) => { ms.innerHTML += '<option value="'+i+'">'+m+'</option>' }); 
            ms.value = cd.getMonth();
            
            for(let y = cd.getFullYear(); y <= cd.getFullYear()+3; y++){
                ys.innerHTML += '<option value="'+y+'">'+y+'</option>'
            } 
            ys.value = cd.getFullYear();
            
            ms.addEventListener('change', () => this.generate());
            ys.addEventListener('change', () => this.generate());
        }

        // التبديل بين تبويبات التقارير
        document.querySelectorAll('.report-tab').forEach(t => { 
            t.addEventListener('click', () => {
                document.querySelectorAll('.report-tab').forEach(x => x.classList.remove('active'));
                document.querySelectorAll('.report-section').forEach(x => x.classList.remove('active'));
                t.classList.add('active'); 
                document.getElementById(t.dataset.report === 'refill' ? 'refillReport' : 'ordersReport').classList.add('active');
            });
        });
        
        // تحديث التقرير عند فتح الصفحة
        const reportsBtn = document.querySelector('[data-page="reports"]');
        if(reportsBtn) {
            reportsBtn.addEventListener('click', () => this.generate());
        }
    },

    generate() {
        const m = parseInt(document.getElementById('reportMonth').value); 
        const y = parseInt(document.getElementById('reportYear').value);
        this.genRefill(m,y); 
        this.genOrders(m,y);
    },

    genRefill(m,y){
        let s=0, c=0; 
        const cp=[];
        
        State.patients.filter(p => p.type === 'refill').forEach(p => {
            // التحقق من الدورة الحالية
            if(p.reminderSent === 'yes' && p.reminderDate){
                const rd = new Date(p.reminderDate); 
                if(rd.getMonth() === m && rd.getFullYear() === y){
                    s++; 
                    if(p.converted === 'yes'){
                        c++; 
                        cp.push(p);
                    }
                }
            }
            // التحقق من الأرشيف (History)
            (p.history||[]).forEach(h => {
                if(h.reminderDate){
                    const rd = new Date(h.reminderDate); 
                    if(rd.getMonth() === m && rd.getFullYear() === y){
                        s++; 
                        if(h.convertedDate){
                            c++; 
                            cp.push({...p, reminderDate:h.reminderDate, convertedDate:h.convertedDate});
                        }
                    }
                }
            });
        });

        const r = s > 0 ? Math.round(c/s*100) : 0;
        
        // تحديث العدادات
        document.getElementById('rSent').textContent = s; 
        document.getElementById('rConverted').textContent = c; 
        document.getElementById('rRate').textContent = r+'%'; 
        document.getElementById('rBar').style.width = r+'%';
        
        // جدول الملخص
        document.getElementById('summaryTb').innerHTML = `
            <tr><td>📤 Sent</td><td>${s}</td><td>100%</td></tr>
            <tr><td>✅ Converted</td><td>${c}</td><td>${r}%</td></tr>`;
            
        // قائمة التحويلات
        document.getElementById('convList').innerHTML = cp.length > 0 ? 
            cp.map(p => `<tr><td class="name">${Utils.sanitize(p.name)}</td><td>${p.phone}</td><td class="med">${Utils.sanitize(p.med)}</td><td>${p.reminderDate}</td><td>${p.convertedDate}</td></tr>`).join('') 
            : '<tr><td colspan="5"><div class="empty">No conversions this month</div></td></tr>';
    },

    genOrders(m,y){
        let t=0, d=0; 
        const bs={}, mc={};
        
        State.patients.filter(p => p.type === 'order').forEach(p => {
            const ad = new Date(p.addedDate); 
            if(ad.getMonth() === m && ad.getFullYear() === y){
                t++; 
                if(!bs[p.branch]) bs[p.branch] = {total:0, delivered:0}; 
                bs[p.branch].total++;
                
                const mn = p.med.toLowerCase().trim(); 
                mc[mn] = (mc[mn]||0) + 1;
                
                if(p.orderStatus === 'delivered'){
                    d++; 
                    bs[p.branch].delivered++
                }
            }
        });

        const r = t > 0 ? Math.round(d/t*100) : 0;
        
        // تحديث العدادات
        document.getElementById('oTotal').textContent = t; 
        document.getElementById('oDelivered').textContent = d; 
        document.getElementById('oNotDelivered').textContent = t-d; 
        document.getElementById('oRate').textContent = r+'%'; 
        document.getElementById('oBar').style.width = r+'%';
        
        // ملخص الفروع
        const branchRows = Object.entries(bs).map(([b,s]) => 
            `<tr><td><strong>${b}</strong></td><td>${s.total}</td><td>${s.delivered}</td><td>${s.total-s.delivered}</td></tr>`
        ).join('');
        document.getElementById('branchSummary').innerHTML = branchRows || '<tr><td colspan="4"><div class="empty">No orders</div></td></tr>';
        
        // أكثر الأصناف طلباً
        const topMeds = Object.entries(mc).sort((a,b) => b[1]-a[1]).slice(0,5).map(([med,cnt]) => 
            `<tr><td class="med">${Utils.sanitize(med)}</td><td>${cnt}</td></tr>`
        ).join('');
        document.getElementById('topMeds').innerHTML = topMeds || '<tr><td colspan="2"><div class="empty">No orders</div></td></tr>';
    }
};
