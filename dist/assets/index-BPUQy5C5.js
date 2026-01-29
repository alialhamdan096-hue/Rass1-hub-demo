(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const u of s.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&a(u)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const O='<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',R={RASS2:"rass2@alraziksa.com",RASS5:"rass5@alraziksa.com",UNIZAH1:"unizah1@alraziksa.com",UNIZAH2:"unizah2@alraziksa.com",UNIZAH3:"unizah3@alraziksa.com",UNIZAH5:"unizah5@alraziksa.com",BADAYA1:"badaya1@alraziksa.com",BADAYA2:"badaya2@alraziksa.com",BADAYA3:"badaya3@alraziksa.com",BADAYA5:"badaya5@alraziksa.com","BADAYA.MOR":"badaya.mor@alraziksa.com",BUKAYRIAH1:"bukayriah1@alraziksa.com",BUKAYRIAH2:"bukayriah2@alraziksa.com","BUKAYRIAH.MOR":"bukayriah.mor@alraziksa.com",BURIDAH1:"buridah1@alraziksa.com",BURIDAH2:"buridah2@alraziksa.com",KHABRA1:"khabra1@alraziksa.com",MITHNAB1:"mithnab1@alraziksa.com",MITHNAB2:"mithnab2@alraziksa.com","RIYADH.KHABRA.MOR":"riyadh.khabra.mor@alraziksa.com"},f={API_URL:"https://script.google.com/macros/s/AKfycbzScqUsOESP_1EQZBqYvXLbkoOkNsDm2_o5twRHbU078-1e5HI7uSgmhDy_mkAmfLv-ig/exec",ITEMS_PER_PAGE:10,SEARCH_DELAY:300,TOAST_DURATION:3e3,PHONE_REGEX:/^(966|0)?5\d{8}$/,MONTHS:["January","February","March","April","May","June","July","August","September","October","November","December"]},d={patients:[],editId:null,currentPage:1,searchQuery:"",statusFilter:"all",typeFilter:"all",entryType:"refill",searchTimeout:null,orderItems:[]},c={showToast(t,e="info"){const n=document.getElementById("toastContainer"),a=document.createElement("div");a.className="toast toast-"+e;const r={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};a.innerHTML="<span>"+r[e]+"</span><span>"+t+"</span>",n.appendChild(a),setTimeout(()=>{a.classList.add("hiding"),setTimeout(()=>a.remove(),300)},f.TOAST_DURATION)},setLoading(t,e="Loading..."){const n=document.getElementById("loadingOverlay");n.querySelector(".loading-text").textContent=e,n.classList.toggle("active",t)},setSyncStatus(t){const e=document.getElementById("sync");e.className=t?"sync sync-ok":"sync sync-err",e.textContent=t?"✓ Connected to Google Sheets":"⚠ Offline Mode"},showModal(t){const{icon:e="⚠️",title:n,message:a,confirmText:r="Confirm",confirmClass:s="",onConfirm:u}=t;document.getElementById("modalIcon").textContent=e,document.getElementById("modalTitle").textContent=n,document.getElementById("modalMessage").textContent=a;const m=document.getElementById("modalConfirm");m.textContent=r,m.className="modal-confirm "+s,m.onclick=()=>{u(),this.closeModal()},document.getElementById("confirmModal").classList.add("active")},closeModal(){document.getElementById("confirmModal").classList.remove("active")},showFieldError(t,e){const n=document.getElementById(t),a=document.getElementById(t+"Error");n&&n.classList.toggle("error",e),a&&a.classList.toggle("show",e)},clearFieldErrors(){["phone","med","date","days","orderMed","orderBranch","branch"].forEach(t=>this.showFieldError(t,!1))},showAlert(t){document.getElementById("alertText").textContent=t,document.getElementById("alertBanner").classList.remove("hidden")},updateOrdersBadge(){const t=d.patients.filter(a=>a.type==="order"&&a.orderStatus!=="delivered").length,e=document.querySelector('[data-page="patients"]');let n=e.querySelector(".tab-badge");t>0?(n||(n=document.createElement("span"),n.className="tab-badge",e.appendChild(n)),n.textContent=t):n&&n.remove()}},o={formatDate(t){if(!t)return"";if(typeof t=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(t))return t;const e=new Date(t);return isNaN(e)?t:e.getFullYear()+"-"+String(e.getMonth()+1).padStart(2,"0")+"-"+String(e.getDate()).padStart(2,"0")},formatDisplayDate(t){if(!t)return"-";const e=new Date(t);return isNaN(e)?t:e.toLocaleDateString("en-US",{month:"short",day:"numeric"})},getToday(){const t=new Date;return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")},getTomorrow(){const t=new Date;return t.setDate(t.getDate()+1),t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")},parseHistory(t){if(!t)return[];if(Array.isArray(t))return t;try{return JSON.parse(t)}catch{return[]}},getRefillDate(t){const e=new Date(t.date);return e.setDate(e.getDate()+parseInt(t.days||30)),e},getDaysUntilRefill(t){const e=new Date;e.setHours(0,0,0,0);const n=this.getRefillDate(t);return n.setHours(0,0,0,0),Math.ceil((n-e)/(1e3*60*60*24))},sanitize(t){if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML},validatePhone(t){return f.PHONE_REGEX.test(t.replace(/\D/g,""))},formatPhone(t){let e=t.replace(/\D/g,"");return e.startsWith("0")?e="966"+e.substring(1):e.startsWith("966")||(e="966"+e),e},debounce(t,e){return function(...n){clearTimeout(d.searchTimeout),d.searchTimeout=setTimeout(()=>t.apply(this,n),e)}},copyToClipboard(t){navigator.clipboard.writeText(t).then(()=>c.showToast("Copied!","success")).catch(()=>c.showToast("Failed","error"))}},v={async request(t,e=null){try{let n=f.API_URL+"?action="+t;e&&(n+="&data="+encodeURIComponent(JSON.stringify(e)));const a=await fetch(n);return c.setSyncStatus(!0),await a.json()}catch(n){throw console.error("API Error:",n),c.setSyncStatus(!1),n}},async loadPatients(t,e){c.setLoading(!0,"Loading...");try{const n=await this.request("get");d.patients=n.map(a=>({id:String(a.id||""),type:a.type||"refill",name:a.name||"",phone:String(a.phone||""),med:a.med||"",date:o.formatDate(a.date),days:String(a.days||"30"),notes:a.notes||"",addedDate:o.formatDate(a.addedDate)||o.formatDate(a.date),branch:a.branch||"",pickupDate:a.pickupDate||"",orderStatus:a.orderStatus||"waiting",arrivedDate:o.formatDate(a.arrivedDate),deliveredDate:o.formatDate(a.deliveredDate),reminderSent:a.reminderSent||"no",reminderDate:o.formatDate(a.reminderDate),converted:a.converted||"no",convertedDate:o.formatDate(a.convertedDate),history:o.parseHistory(a.history)})),localStorage.setItem("patients_rass1",JSON.stringify(d.patients)),e&&e()}catch{d.patients=JSON.parse(localStorage.getItem("patients_rass1"))||[],c.showToast("Loaded from cache","warning")}finally{c.setLoading(!1),t&&t(),c.updateOrdersBadge()}},async savePatient(t,e){const n={...t,history:JSON.stringify(t.history||[])};try{e==="delete"?await fetch(f.API_URL+"?action=delete&id="+t.id):await this.request(e,n),c.setSyncStatus(!0)}catch{c.setSyncStatus(!1)}localStorage.setItem("patients_rass1",JSON.stringify(d.patients))}},C={renderCallback:null,trackingCallback:null,setCallbacks(t,e){this.renderCallback=t,this.trackingCallback=e},async save(t){t.preventDefault(),c.clearFieldErrors();const e=d.entryType,n=document.getElementById("phone").value,a=document.getElementById("med").value.trim();let r=!0;if(o.validatePhone(n)||(c.showFieldError("phone",!0),r=!1),a||(c.showFieldError("med",!0),r=!1),e==="refill"){document.getElementById("date").value||(c.showFieldError("date",!0),r=!1);const l=parseInt(document.getElementById("days").value);(!l||l<1||l>365)&&(c.showFieldError("days",!0),r=!1)}else document.getElementById("branch").value||(c.showFieldError("branch",!0),r=!1);if(!r){c.showToast("Please fix errors","error");return}const s=document.getElementById("submitBtn");s.disabled=!0,s.innerHTML="<span>⏳</span> Saving...";let u="";if(e==="order"){const l=document.getElementById("pickupDate").value;l==="today"?u=o.getToday():l==="tomorrow"?u=o.getTomorrow():l==="custom"&&(u=document.getElementById("customPickupDate").value)}const m={id:d.editId||Date.now().toString(),type:e,name:document.getElementById("name").value.trim(),phone:o.formatPhone(n),med:a,date:e==="refill"?document.getElementById("date").value:"",days:e==="refill"?document.getElementById("days").value:"",notes:document.getElementById("notes").value.trim(),addedDate:d.editId?null:o.getToday(),branch:e==="order"?document.getElementById("branch").value:"",pickupDate:u,orderStatus:e==="order"?"waiting":"",arrivedDate:"",deliveredDate:"",reminderSent:"no",reminderDate:"",converted:"no",convertedDate:"",history:[]};if(d.editId){const l=d.patients.find(y=>y.id===d.editId);m.addedDate=l.addedDate,m.orderStatus=l.orderStatus,m.arrivedDate=l.arrivedDate,m.deliveredDate=l.deliveredDate,m.reminderSent=l.reminderSent,m.reminderDate=l.reminderDate,m.converted=l.converted,m.convertedDate=l.convertedDate,m.history=l.history||[],d.patients[d.patients.findIndex(y=>y.id===d.editId)]=m}else d.patients.push(m);await v.savePatient(m,d.editId?"update":"add"),c.showToast(d.editId?"Updated!":"Added!","success"),this.renderCallback&&this.renderCallback(),c.updateOrdersBadge(),window.resetForm(),s.disabled=!1,s.innerHTML="<span>➕</span> Add "+(e==="refill"?"Patient":"Order")},edit(t){const e=d.patients.find(n=>n.id===t);e&&(d.editId=t,window.setEntryType(e.type||"refill"),document.getElementById("name").value=e.name,document.getElementById("phone").value=e.phone,document.getElementById("med").value=e.med,document.getElementById("notes").value=e.notes||"",e.type==="refill"?(document.getElementById("date").value=e.date,document.getElementById("days").value=e.days):(document.getElementById("branch").value=e.branch,e.pickupDate===o.getToday()?document.getElementById("pickupDate").value="today":e.pickupDate===o.getTomorrow()?document.getElementById("pickupDate").value="tomorrow":e.pickupDate&&(document.getElementById("pickupDate").value="custom",document.getElementById("customPickupDate").value=e.pickupDate,document.getElementById("customDateGroup").style.display="block")),document.getElementById("formTitle").textContent="✏️ Edit",document.getElementById("submitBtn").innerHTML="<span>💾</span> Update",window.scrollTo({top:0,behavior:"smooth"}))},delete(t){const e=d.patients.find(n=>n.id===t);c.showModal({icon:"🗑️",title:"Delete",message:'Delete "'+(e.name||e.phone)+'"?',confirmText:"Delete",confirmClass:"danger",onConfirm:async()=>{d.patients=d.patients.filter(n=>n.id!==t),await v.savePatient({id:t},"delete"),c.showToast("Deleted!","success"),this.renderCallback&&this.renderCallback(),c.updateOrdersBadge()}})},confirmWhatsApp(t){const e=d.patients.find(n=>n.id===t);c.showModal({icon:"📱",title:"Send WhatsApp",message:'Send reminder to "'+(e.name||e.phone)+'"?',confirmText:"Send",confirmClass:"success",onConfirm:()=>this.sendRefillWhatsApp(t)})},sendRefillWhatsApp(t){const e=d.patients.find(a=>a.id===t);if(!e)return;const n=`السلام عليكم ورحمة الله وبركاته
صيدلية الرازي الرس 1 ترحب بكم

هذا تذكير بموعد صرف الدواء الخاص بك:

الدواء: `+e.med+`

نسعد بتجهيزه لكم عبر:

- الاستلام من الصيدلية
- التوصيل لموقعكم

📍 موقع الصيدلية:
https://shorturl.at/M2Cq3

نتمنى لكم دوام الصحة والعافية`;window.open("https://wa.me/"+e.phone+"?text="+encodeURIComponent(n),"_blank"),e.reminderSent="yes",e.reminderDate=o.getToday(),v.savePatient(e,"update"),c.showToast("WhatsApp opened!","success"),this.renderCallback&&this.renderCallback(),this.trackingCallback&&this.trackingCallback()},confirmArrived(t){const e=d.patients.find(n=>n.id===t);c.showModal({icon:"📥",title:"Order Arrived",message:'Send WhatsApp to "'+(e.name||e.phone)+'"?',confirmText:"Yes, Send",confirmClass:"success",onConfirm:()=>this.markArrived(t)})},async markArrived(t){const e=d.patients.find(a=>a.id===t);e.orderStatus="pending",e.arrivedDate=o.getToday();const n=`السلام عليكم ورحمة الله وبركاته
صيدلية الرازي الرس 1

طلبكم جاهز للاستلام ✅

الدواء: `+e.med+`

📍 موقع الصيدلية:
https://shorturl.at/M2Cq3

نسعد بخدمتكم`;window.open("https://wa.me/"+e.phone+"?text="+encodeURIComponent(n),"_blank"),await v.savePatient(e,"update"),c.showToast("WhatsApp opened!","success"),this.renderCallback&&this.renderCallback(),c.updateOrdersBadge()},async markDelivered(t){const e=d.patients.find(n=>n.id===t);e.orderStatus="delivered",e.deliveredDate=o.getToday(),await v.savePatient(e,"update"),c.showToast("Delivered!","success"),this.renderCallback&&this.renderCallback(),c.updateOrdersBadge()},async markConverted(t){const e=d.patients.find(n=>n.id===t);e.converted="yes",e.convertedDate=o.getToday(),await v.savePatient(e,"update"),c.showToast("Converted!","success"),this.renderCallback&&this.renderCallback(),this.trackingCallback&&this.trackingCallback()},async undoConverted(t){const e=d.patients.find(n=>n.id===t);e.converted="no",e.convertedDate="",await v.savePatient(e,"update"),c.showToast("Undone","info"),this.trackingCallback&&this.trackingCallback()},async renewPatient(t){const e=d.patients.find(n=>n.id===t);e.history||(e.history=[]),e.history.push({date:e.date,reminderDate:e.reminderDate,convertedDate:e.convertedDate}),e.date=o.getToday(),e.reminderSent="no",e.reminderDate="",e.converted="no",e.convertedDate="",await v.savePatient(e,"update"),c.showToast("Renewed!","success"),this.renderCallback&&this.renderCallback(),this.trackingCallback&&this.trackingCallback()}},E={addItem(t){t.preventDefault(),c.clearFieldErrors();const e=document.getElementById("orderMed").value.trim(),n=parseInt(document.getElementById("orderQty").value)||1,a=document.getElementById("orderBranch").value,r=document.getElementById("orderClient").checked;if(!e){c.showFieldError("orderMed",!0);return}if(!a){c.showFieldError("orderBranch",!0);return}d.orderItems.push({id:Date.now(),med:e,qty:n,branch:a,isClient:r}),document.getElementById("orderMed").value="",document.getElementById("orderQty").value="1",document.getElementById("orderClient").checked=!1,this.renderOrders(),c.showToast("Added to list","success")},removeItem(t){d.orderItems=d.orderItems.filter(e=>e.id!==t),this.renderOrders()},clearAll(){d.orderItems.length!==0&&c.showModal({icon:"🗑️",title:"Clear All",message:"Remove all items?",confirmText:"Clear",confirmClass:"danger",onConfirm:()=>{d.orderItems=[],this.renderOrders()}})},renderOrders(){const t=document.getElementById("ordersList"),e=document.getElementById("sendSection"),n=document.getElementById("clearAllBtn");if(d.orderItems.length===0){t.innerHTML='<div class="empty">No items</div>',e.style.display="none",n.style.display="none";return}n.style.display="inline-flex",t.innerHTML=d.orderItems.map(r=>`<div class="order-item"><div class="order-item-info"><div class="order-item-med">${o.sanitize(r.med)} ${r.isClient?'<span class="badge badge-client">لعميل</span>':""}</div><div class="order-item-details">Qty: ${r.qty}</div><div class="order-item-branch">From: ${r.branch}</div></div><button class="order-item-del" onclick="OrdersModule.removeItem(${r.id})">🗑️</button></div>`).join(""),e.style.display="block";const a={};d.orderItems.forEach(r=>{a[r.branch]||(a[r.branch]=[]),a[r.branch].push(r)}),document.getElementById("groupedOrders").innerHTML=Object.entries(a).map(([r,s])=>`<div class="send-group"><div class="send-group-header"><span class="send-group-title">📍 ${r}</span><span class="send-group-count">${s.length} items</span></div><div class="send-group-items">${s.map(u=>`<div class="send-group-item ${u.isClient?"client":""}">• ${o.sanitize(u.med)} - Qty: ${u.qty}</div>`).join("")}</div><button class="btn btn-info btn-sm" onclick="OrdersModule.sendEmail('${r}')" style="margin-top:10px">📧 Send to ${r}</button></div>`).join("")},sendEmail(t){const e=d.orderItems.filter(s=>s.branch===t);if(e.length===0)return;const n=R[t],a="طلب تحويل أصناف - صيدلية الرس 1";let r=`السلام عليكم

نرجو تحويل الأصناف التالية:

`;e.forEach(s=>{r+=`• ${s.med} - الكمية: ${s.qty}${s.isClient?" (لعميل)":""}
`}),r+=`
وجزاكم الله خيراً
صيدلية الرازي - الرس 1`,window.open(`mailto:${n}?subject=${encodeURIComponent(a)}&body=${encodeURIComponent(r)}`)},sendAllEmails(){[...new Set(d.orderItems.map(e=>e.branch))].forEach((e,n)=>{setTimeout(()=>{this.sendEmail(e)},n*500)})}},P={show(t){const e=d.patients.find(y=>y.id===t);if(!e)return;const n=document.getElementById("historyModal"),a=document.getElementById("historyContent");document.getElementById("historyPatientName").textContent=e.name||e.phone,document.getElementById("historyPatientPhone").textContent=e.phone,document.getElementById("historyPatientMed").textContent=e.med;let r="";r+=`
            <div class="history-section">
                <div class="history-section-title">📍 الدورة الحالية</div>
                <div class="history-item current">
                    <div class="history-item-row">
                        <span class="history-label">تاريخ الصرف:</span>
                        <span class="history-value">${e.date||"-"}</span>
                    </div>
                    <div class="history-item-row">
                        <span class="history-label">المدة:</span>
                        <span class="history-value">${e.days||"-"} يوم</span>
                    </div>
                    <div class="history-item-row">
                        <span class="history-label">تاريخ الإضافة:</span>
                        <span class="history-value">${e.addedDate||"-"}</span>
                    </div>
                    ${e.reminderSent==="yes"?`
                    <div class="history-item-row">
                        <span class="history-label">📤 تذكير:</span>
                        <span class="history-value">${e.reminderDate||"-"}</span>
                    </div>
                    `:""}
                    ${e.converted==="yes"?`
                    <div class="history-item-row">
                        <span class="history-label">✅ تحويل:</span>
                        <span class="history-value">${e.convertedDate||"-"}</span>
                    </div>
                    `:""}
                    ${e.notes?`
                    <div class="history-item-row">
                        <span class="history-label">📝 ملاحظات:</span>
                        <span class="history-value">${o.sanitize(e.notes)}</span>
                    </div>
                    `:""}
                </div>
            </div>
        `;const s=e.history||[];s.length>0?(r+=`
                <div class="history-section">
                    <div class="history-section-title">📜 السجل السابق (${s.length} دورة)</div>
            `,s.slice().reverse().forEach((y,p)=>{r+=`
                    <div class="history-item">
                        <div class="history-cycle-num">#${s.length-p}</div>
                        <div class="history-item-row">
                            <span class="history-label">تاريخ الصرف:</span>
                            <span class="history-value">${y.date||"-"}</span>
                        </div>
                        ${y.reminderDate?`
                        <div class="history-item-row">
                            <span class="history-label">📤 تذكير:</span>
                            <span class="history-value">${y.reminderDate}</span>
                        </div>
                        `:""}
                        ${y.convertedDate?`
                        <div class="history-item-row">
                            <span class="history-label">✅ تحويل:</span>
                            <span class="history-value">${y.convertedDate}</span>
                        </div>
                        `:""}
                    </div>
                `}),r+="</div>"):r+=`
                <div class="history-section">
                    <div class="history-empty">لا يوجد سجل سابق</div>
                </div>
            `;const u=s.length+1,m=s.filter(y=>y.reminderDate).length+(e.reminderSent==="yes"?1:0),l=s.filter(y=>y.convertedDate).length+(e.converted==="yes"?1:0);r+=`
            <div class="history-stats">
                <div class="history-stat">
                    <div class="history-stat-num">${u}</div>
                    <div class="history-stat-label">دورة</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${m}</div>
                    <div class="history-stat-label">تذكير</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${l}</div>
                    <div class="history-stat-label">تحويل</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${m>0?Math.round(l/m*100):0}%</div>
                    <div class="history-stat-label">معدل</div>
                </div>
            </div>
        `,a.innerHTML=r,n.classList.add("active")},close(){document.getElementById("historyModal").classList.remove("active")}},B={currentPatientId:null,show(t){const e=d.patients.find(s=>s.id===t);if(!e)return;this.currentPatientId=t;const n=e.type==="order",a=new Date().toLocaleDateString("ar-SA",{year:"numeric",month:"long",day:"numeric"}),r=document.getElementById("labelPreview");r.innerHTML=`
            <div class="label-card" id="labelContent">
                <div class="label-pharmacy">
                    <div class="label-pharmacy-name">صيدلية الرازي</div>
                    <div class="label-pharmacy-branch">الرس 1</div>
                </div>
                <div class="label-type ${n?"order":"refill"}">
                    ${n?"📦 طلب تحويل":"💊 إعادة صرف"}
                </div>
                <div class="label-info">
                    <div class="label-row">
                        <span class="label-key">العميل:</span>
                        <span class="label-value">${o.sanitize(e.name)||"-"}</span>
                    </div>
                    <div class="label-row">
                        <span class="label-key">الجوال:</span>
                        <span class="label-value ltr">${e.phone}</span>
                    </div>
                </div>
                <div class="label-med">
                    <div class="label-med-title">${n?"الصنف":"الدواء"}</div>
                    <div class="label-med-name">${o.sanitize(e.med)}</div>
                </div>
                ${n&&e.branch?`
                <div class="label-row">
                    <span class="label-key">من فرع:</span>
                    <span class="label-value">${e.branch}</span>
                </div>
                `:""}
                ${!n&&e.days?`
                <div class="label-row">
                    <span class="label-key">المدة:</span>
                    <span class="label-value">${e.days} يوم</span>
                </div>
                `:""}
                ${e.notes?`
                <div class="label-notes">📝 ${o.sanitize(e.notes)}</div>
                `:""}
                <div class="label-footer">
                    <div class="label-id">#${e.id.slice(-6)}</div>
                    <div class="label-date">${a}</div>
                </div>
            </div>
        `,document.getElementById("labelModal").classList.add("active")},close(){document.getElementById("labelModal").classList.remove("active"),this.currentPatientId=null},print(){const t=document.getElementById("labelContent");if(!t)return;const e=window.open("","_blank","width=400,height=600");e.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>طباعة ملصق</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            padding: 5mm;
            display: flex;
            justify-content: center;
        }
        .label-card {
            border: 2px solid #333;
            border-radius: 8px;
            padding: 12px;
            width: 75mm;
            background: white;
        }
        .label-pharmacy {
            text-align: center;
            padding-bottom: 8px;
            border-bottom: 2px dashed #333;
            margin-bottom: 8px;
        }
        .label-pharmacy-name {
            font-size: 16px;
            font-weight: bold;
        }
        .label-pharmacy-branch {
            font-size: 11px;
            color: #666;
        }
        .label-type {
            text-align: center;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            margin: 8px auto;
            display: inline-block;
            width: 100%;
        }
        .label-type.refill {
            background: #dcfce7;
            color: #166534;
        }
        .label-type.order {
            background: #dbeafe;
            color: #1e40af;
        }
        .label-info {
            margin: 8px 0;
        }
        .label-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 11px;
            border-bottom: 1px dotted #ddd;
        }
        .label-key { color: #666; }
        .label-value { font-weight: 600; }
        .label-value.ltr { direction: ltr; }
        .label-med {
            background: #f3f4f6;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            text-align: center;
        }
        .label-med-title {
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
        }
        .label-med-name {
            font-size: 14px;
            font-weight: bold;
            color: #7c3aed;
        }
        .label-notes {
            background: #fef3c7;
            padding: 6px;
            border-radius: 4px;
            font-size: 10px;
            text-align: center;
            margin: 8px 0;
        }
        .label-footer {
            display: flex;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 2px dashed #333;
            margin-top: 8px;
            font-size: 9px;
            color: #888;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    ${t.outerHTML}
    <script>
        window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
        }
    <\/script>
</body>
</html>
        `),e.document.close()}};function S(){const t=document.getElementById("trackFilter").value;let e=d.patients.filter(s=>s.type==="refill"&&s.reminderSent==="yes");t==="waiting"?e=e.filter(s=>s.converted!=="yes"):t==="converted"&&(e=e.filter(s=>s.converted==="yes")),e.sort((s,u)=>new Date(u.reminderDate)-new Date(s.reminderDate));let n=0,a=0;d.patients.filter(s=>s.type==="refill").forEach(s=>{s.reminderSent==="yes"&&n++,s.converted==="yes"&&a++,(s.history||[]).forEach(u=>{u.reminderDate&&n++,u.convertedDate&&a++})}),document.getElementById("tSent").textContent=n,document.getElementById("tConverted").textContent=a,document.getElementById("tRate").textContent=n>0?Math.round(a/n*100)+"%":"0%";const r=document.getElementById("trackGrid");if(e.length===0){r.innerHTML='<div class="empty" style="grid-column:1/-1">No records</div>';return}r.innerHTML=e.map(s=>{const u=(s.history||[]).length,m=u>0?'<div class="history-badge">🔄 '+u+"</div>":"";return s.converted==="yes"?`<div class="track-card converted">${m}<div class="name">${o.sanitize(s.name)}</div><div class="phone">${o.sanitize(s.phone)}</div><div class="med">${o.sanitize(s.med)}</div><div class="info">📤 ${s.reminderDate}<br>✅ ${s.convertedDate}</div><button class="track-btn done" onclick="PatientActions.undoConverted('${s.id}')">✅ Converted (Undo)</button><button class="track-btn renew" onclick="PatientActions.renewPatient('${s.id}')">🔄 Renew</button></div>`:`<div class="track-card">${m}<div class="name">${o.sanitize(s.name)}</div><div class="phone">${o.sanitize(s.phone)}</div><div class="med">${o.sanitize(s.med)}</div><div class="info">📤 ${s.reminderDate}</div><button class="track-btn" onclick="PatientActions.markConverted('${s.id}')">✅ Mark Converted</button></div>`}).join("")}function A(){const t=parseInt(document.getElementById("reportMonth").value),e=parseInt(document.getElementById("reportYear").value);H(t,e),z(t,e)}function H(t,e){let n=0,a=0;const r=[];d.patients.filter(l=>l.type==="refill").forEach(l=>{if(l.reminderSent==="yes"&&l.reminderDate){const y=new Date(l.reminderDate);y.getMonth()===t&&y.getFullYear()===e&&(n++,l.converted==="yes"&&(a++,r.push({name:l.name,phone:l.phone,med:l.med,reminderDate:l.reminderDate,convertedDate:l.convertedDate})))}(l.history||[]).forEach(y=>{if(y.reminderDate){const p=new Date(y.reminderDate);p.getMonth()===t&&p.getFullYear()===e&&(n++,y.convertedDate&&(a++,r.push({name:l.name,phone:l.phone,med:l.med,reminderDate:y.reminderDate,convertedDate:y.convertedDate})))}})});const s=n>0?Math.round(a/n*100):0,u=n-a,m=n>0?Math.round(u/n*100):0;document.getElementById("rSent").textContent=n,document.getElementById("rConverted").textContent=a,document.getElementById("rRate").textContent=s+"%",document.getElementById("rBar").style.width=s+"%",document.getElementById("summaryTb").innerHTML=`<tr><td>📤 Sent</td><td>${n}</td><td>100%</td></tr><tr><td>✅ Converted</td><td>${a}</td><td>${s}%</td></tr><tr><td>⏳ Waiting</td><td>${u}</td><td>${m}%</td></tr>`,document.getElementById("convList").innerHTML=r.length>0?r.map(l=>`<tr><td class="name">${o.sanitize(l.name)}</td><td class="phone">${o.sanitize(l.phone)}</td><td class="med">${o.sanitize(l.med)}</td><td>${l.reminderDate}</td><td>${l.convertedDate}</td></tr>`).join(""):'<tr><td colspan="5"><div class="empty">No conversions</div></td></tr>'}function z(t,e){let n=0,a=0;const r={},s={};d.patients.filter(p=>p.type==="order").forEach(p=>{const i=new Date(p.addedDate);if(i.getMonth()===t&&i.getFullYear()===e){n++,r[p.branch]||(r[p.branch]={total:0,delivered:0}),r[p.branch].total++;const g=p.med.toLowerCase().trim();s[g]=(s[g]||0)+1,p.orderStatus==="delivered"&&(a++,r[p.branch].delivered++)}});const u=n-a,m=n>0?Math.round(a/n*100):0;document.getElementById("oTotal").textContent=n,document.getElementById("oDelivered").textContent=a,document.getElementById("oNotDelivered").textContent=u,document.getElementById("oRate").textContent=m+"%",document.getElementById("oBar").style.width=m+"%";const l=Object.entries(r).sort((p,i)=>i[1].total-p[1].total).map(([p,i])=>`<tr><td><strong>${p}</strong></td><td>${i.total}</td><td>${i.delivered}</td><td>${i.total-i.delivered}</td></tr>`).join("");document.getElementById("branchSummary").innerHTML=l||'<tr><td colspan="4"><div class="empty">No orders</div></td></tr>';const y=Object.entries(s).sort((p,i)=>i[1]-p[1]).slice(0,10).map(([p,i])=>`<tr><td class="med">${o.sanitize(p)}</td><td>${i}</td></tr>`).join("");document.getElementById("topMeds").innerHTML=y||'<tr><td colspan="2"><div class="empty">No orders</div></td></tr>'}function I(){const t=d.searchQuery.toLowerCase(),e=d.typeFilter,n=d.statusFilter;let a=d.patients.filter(i=>{if(!(i.name.toLowerCase().includes(t)||i.med.toLowerCase().includes(t)||i.phone.includes(t))||e!=="all"&&i.type!==e)return!1;if(n!=="all"){if(i.type==="refill"){const h=o.getDaysUntilRefill(i);if(n==="overdue"&&h>=0||n==="soon"&&(h<0||h>2)||n==="ok"&&h<=2||n==="waiting"||n==="pending")return!1}else if(n==="waiting"&&i.orderStatus!=="waiting"||n==="pending"&&i.orderStatus!=="pending"||["overdue","soon","ok"].includes(n))return!1}return!0});a.sort((i,g)=>i.type==="order"&&g.type==="refill"?-1:i.type==="refill"&&g.type==="order"?1:i.type==="order"?new Date(i.addedDate)-new Date(g.addedDate):o.getRefillDate(i)-o.getRefillDate(g));let r=0,s=0,u=0;d.patients.forEach(i=>{if(i.type==="refill"){const g=o.getDaysUntilRefill(i);g<0?s++:g<=2&&r++}else i.type==="order"&&i.orderStatus!=="delivered"&&u++}),document.getElementById("total").textContent=d.patients.length,document.getElementById("warn").textContent=r,document.getElementById("over").textContent=s,document.getElementById("pendingOrders").textContent=u;const m=Math.ceil(a.length/f.ITEMS_PER_PAGE);d.currentPage=Math.min(d.currentPage,m||1);const l=(d.currentPage-1)*f.ITEMS_PER_PAGE,y=a.slice(l,l+f.ITEMS_PER_PAGE),p=document.getElementById("patientsTbody");if(y.length===0){p.innerHTML='<tr><td colspan="7"><div class="empty">No records found</div></td></tr>',document.getElementById("pagination").innerHTML="";return}p.innerHTML=y.map(i=>{const g=i.type==="order";let h,b,k;if(g)i.orderStatus==="delivered"?(h="✅ Delivered",b="delivered"):i.orderStatus==="pending"?(h="⏳ Pending",b="waiting"):(h="🔵 Waiting",b="info"),k=i.pickupDate?o.formatDisplayDate(i.pickupDate):"-";else{const w=o.getDaysUntilRefill(i);k=o.getRefillDate(i).toLocaleDateString("en-US",{month:"short",day:"numeric"}),w<0?(h="Overdue "+Math.abs(w)+"d",b="danger"):w<=2?(h=w+"d left",b="warn"):(h=w+"d left",b="ok")}const M=o.formatDisplayDate(i.addedDate),T=(i.history||[]).length,x=T>0?' <span class="badge badge-ok">'+T+"</span>":"";let D="";return g?i.orderStatus==="waiting"?D=`<button class="arrived" onclick="PatientActions.confirmArrived('`+i.id+`')" title="Arrived">📥</button><button class="edit" onclick="PatientActions.edit('`+i.id+`')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete('`+i.id+`')" title="Delete">🗑️</button>`:i.orderStatus==="pending"?D=`<button class="done" onclick="PatientActions.markDelivered('`+i.id+`')" title="Delivered">✅</button><button class="print-btn" onclick="LabelPrint.show('`+i.id+`')" title="طباعة">🏷️</button><button class="edit" onclick="PatientActions.edit('`+i.id+`')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete('`+i.id+`')" title="Delete">🗑️</button>`:D=`<button class="edit" onclick="PatientActions.edit('`+i.id+`')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete('`+i.id+`')" title="Delete">🗑️</button>`:D=`<button class="wa" onclick="PatientActions.confirmWhatsApp('`+i.id+`')" title="WhatsApp">`+O+`</button><button class="print-btn" onclick="LabelPrint.show('`+i.id+`')" title="طباعة">🏷️</button><button class="history-btn" onclick="PatientHistory.show('`+i.id+`')" title="السجل">📋</button><button class="edit" onclick="PatientActions.edit('`+i.id+`')" title="Edit">✏️</button><button class="del" onclick="PatientActions.delete('`+i.id+`')" title="Delete">🗑️</button>`,`<tr class="${g?"order-row":""}">
            <td><span class="type-badge">${g?"📦":"💊"}</span></td>
            <td><div class="name">${o.sanitize(i.name)}${x}</div><div class="phone"><span class="phone-copy" onclick="Utils.copyToClipboard('${i.phone}')" title="Copy">📋</span>${o.sanitize(i.phone)}</div>${g&&i.branch?'<div class="branch-info">From: '+i.branch+"</div>":""}</td>
            <td><div class="med">${o.sanitize(i.med)}</div>${i.notes?'<div class="phone">'+o.sanitize(i.notes)+"</div>":""}</td>
            <td><span class="date-added">${M}</span></td>
            <td>${k}</td>
            <td><span class="badge badge-${b}">${h}</span></td>
            <td><div class="actions">${D}</div></td>
        </tr>`}).join(""),F(m,a.length)}function F(t,e){const n=document.getElementById("pagination");if(t<=1){n.innerHTML="";return}let a='<button onclick="changePage(1)" '+(d.currentPage===1?"disabled":"")+'>«</button><button onclick="changePage('+(d.currentPage-1)+')" '+(d.currentPage===1?"disabled":"")+">‹</button>";const r=5;let s=Math.max(1,d.currentPage-Math.floor(r/2)),u=Math.min(t,s+r-1);u-s+1<r&&(s=Math.max(1,u-r+1));for(let m=s;m<=u;m++)a+='<button onclick="changePage('+m+')" class="'+(m===d.currentPage?"active":"")+'">'+m+"</button>";a+='<button onclick="changePage('+(d.currentPage+1)+')" '+(d.currentPage===t?"disabled":"")+'>›</button><button onclick="changePage('+t+')" '+(d.currentPage===t?"disabled":"")+'>»</button><span class="pagination-info">'+e+" records</span>",n.innerHTML=a}function N(t){d.currentPage=t,I()}function L(t){d.entryType=t,document.getElementById("entryType").value=t,document.querySelectorAll(".type-btn").forEach(a=>{a.classList.remove("active"),a.dataset.type===t&&a.classList.add("active")});const e=document.getElementById("medLabel"),n=document.getElementById("med");t==="refill"?(e.innerHTML='Medication <span class="required">*</span>',n.placeholder="Medication name"):(e.innerHTML='Item Name <span class="required">*</span>',n.placeholder="Product or Item name"),document.getElementById("refillFields").style.display=t==="refill"?"block":"none",document.getElementById("orderFields").style.display=t==="order"?"block":"none",document.getElementById("submitBtn").innerHTML="<span>➕</span> Add "+(t==="refill"?"Patient":"Order"),c.clearFieldErrors()}function U(){document.getElementById("customDateGroup").style.display=document.getElementById("pickupDate").value==="custom"?"block":"none"}function $(t){document.querySelectorAll(".report-tab").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".report-section").forEach(e=>e.classList.remove("active")),document.querySelector('[data-report="'+t+'"]').classList.add("active"),document.getElementById(t==="refill"?"refillReport":"ordersReport").classList.add("active")}function q(){d.editId=null,document.getElementById("patientForm").reset(),document.getElementById("days").value="30",document.getElementById("date").valueAsDate=new Date,document.getElementById("formTitle").textContent="➕ Add New",document.getElementById("submitBtn").innerHTML="<span>➕</span> Add "+(d.entryType==="refill"?"Patient":"Order"),document.getElementById("customDateGroup").style.display="none",c.clearFieldErrors()}function _(t){document.querySelectorAll(".page").forEach(e=>e.classList.remove("active")),document.querySelectorAll(".tab").forEach(e=>e.classList.remove("active")),document.getElementById(t+"Page").classList.add("active"),document.querySelector('[data-page="'+t+'"]').classList.add("active"),t==="tracking"&&S(),t==="reports"&&A(),t==="orders"&&E.renderOrders()}function Y(){const t=o.getToday(),e=d.patients.filter(r=>r.type==="order"&&r.orderStatus!=="delivered"&&r.pickupDate===t).length,n=d.patients.filter(r=>r.type==="refill"&&o.getDaysUntilRefill(r)<0).length;let a=[];e>0&&a.push(e+" orders for today"),n>0&&a.push(n+" overdue refills"),a.length>0&&c.showAlert("🔔 "+a.join(" • "))}window.PatientActions=C;window.OrdersModule=E;window.PatientHistory=P;window.LabelPrint=B;window.Utils=o;window.UI=c;window.changePage=N;window.resetForm=q;window.setEntryType=L;window.showReportTab=$;C.setCallbacks(I,S);document.addEventListener("DOMContentLoaded",()=>{document.getElementById("date").valueAsDate=new Date;const t=document.getElementById("reportMonth"),e=document.getElementById("reportYear"),n=new Date;f.MONTHS.forEach((a,r)=>{t.innerHTML+='<option value="'+r+'">'+a+"</option>"}),t.value=n.getMonth();for(let a=n.getFullYear();a<=n.getFullYear()+3;a++)e.innerHTML+='<option value="'+a+'">'+a+"</option>";e.value=n.getFullYear(),document.querySelectorAll(".tab").forEach(a=>{a.addEventListener("click",()=>_(a.dataset.page))}),document.querySelectorAll(".type-btn").forEach(a=>{a.addEventListener("click",()=>L(a.dataset.type))}),document.querySelectorAll(".report-tab").forEach(a=>{a.addEventListener("click",()=>$(a.dataset.report))}),document.getElementById("patientForm").addEventListener("submit",a=>C.save(a)),document.getElementById("orderForm").addEventListener("submit",a=>E.addItem(a)),document.getElementById("pickupDate").addEventListener("change",U),document.getElementById("clearAllBtn").addEventListener("click",()=>E.clearAll()),document.getElementById("sendAllBtn").addEventListener("click",()=>E.sendAllEmails()),document.getElementById("modalCancelBtn").addEventListener("click",()=>c.closeModal()),document.getElementById("historyCloseBtn").addEventListener("click",()=>P.close()),document.getElementById("labelCloseBtn").addEventListener("click",()=>B.close()),document.getElementById("labelCancelBtn").addEventListener("click",()=>B.close()),document.getElementById("labelPrintBtn").addEventListener("click",()=>B.print()),document.getElementById("search").addEventListener("input",o.debounce(a=>{d.searchQuery=a.target.value,d.currentPage=1,I()},f.SEARCH_DELAY)),document.getElementById("typeFilter").addEventListener("change",a=>{d.typeFilter=a.target.value,d.currentPage=1,I()}),document.getElementById("statusFilter").addEventListener("change",a=>{d.statusFilter=a.target.value,d.currentPage=1,I()}),document.getElementById("trackFilter").addEventListener("change",S),document.getElementById("reportMonth").addEventListener("change",A),document.getElementById("reportYear").addEventListener("change",A),v.loadPatients(I,Y),E.renderOrders()});
