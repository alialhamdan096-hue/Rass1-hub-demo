import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== LABEL PRINTING MODULE ====================
export const LabelPrint = {
    currentPatientId: null,

    show(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;

        this.currentPatientId = id;
        const isOrder = p.type === 'order';
        const today = new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const preview = document.getElementById('labelPreview');
        preview.innerHTML = `
            <div class="label-card" id="labelContent">
                <div class="label-pharmacy">
                    <div class="label-pharmacy-name">صيدلية الرازي</div>
                    <div class="label-pharmacy-branch">الرس 1</div>
                </div>
                <div class="label-type ${isOrder ? 'order' : 'refill'}">
                    ${isOrder ? '📦 طلب تحويل' : '💊 إعادة صرف'}
                </div>
                <div class="label-info">
                    <div class="label-row">
                        <span class="label-key">العميل:</span>
                        <span class="label-value">${Utils.sanitize(p.name) || '-'}</span>
                    </div>
                    <div class="label-row">
                        <span class="label-key">الجوال:</span>
                        <span class="label-value ltr">${p.phone}</span>
                    </div>
                </div>
                <div class="label-med">
                    <div class="label-med-title">${isOrder ? 'الصنف' : 'الدواء'}</div>
                    <div class="label-med-name">${Utils.sanitize(p.med)}</div>
                </div>
                ${isOrder && p.branch ? `
                <div class="label-row">
                    <span class="label-key">من فرع:</span>
                    <span class="label-value">${p.branch}</span>
                </div>
                ` : ''}
                ${!isOrder && p.days ? `
                <div class="label-row">
                    <span class="label-key">المدة:</span>
                    <span class="label-value">${p.days} يوم</span>
                </div>
                ` : ''}
                ${p.notes ? `
                <div class="label-notes">📝 ${Utils.sanitize(p.notes)}</div>
                ` : ''}
                <div class="label-footer">
                    <div class="label-id">#${p.id.slice(-6)}</div>
                    <div class="label-date">${today}</div>
                </div>
            </div>
        `;

        document.getElementById('labelModal').classList.add('active');
    },

    close() {
        document.getElementById('labelModal').classList.remove('active');
        this.currentPatientId = null;
    },

    print() {
        const content = document.getElementById('labelContent');
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=400,height=600');

        printWindow.document.write(`
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
    ${content.outerHTML}
    <script>
        window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
        }
    </script>
</body>
</html>
        `);

        printWindow.document.close();
    }
};
