import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== LABEL PRINTING MODULE ====================
export const LabelPrint = {
    show(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;

        const isOrder = p.type === 'order';
        const today = new Date().toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Create print window
        const printWindow = window.open('', '_blank', 'width=400,height=600');

        printWindow.document.write(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>ملصق - ${p.name || p.phone}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            padding: 10mm;
            background: white;
        }
        .label {
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            max-width: 80mm;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }
        .pharmacy-name {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
        }
        .pharmacy-branch {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }
        .type-badge {
            display: inline-block;
            background: ${isOrder ? '#3b82f6' : '#10b981'};
            color: white;
            padding: 3px 12px;
            border-radius: 15px;
            font-size: 11px;
            margin-top: 8px;
        }
        .content {
            padding: 10px 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label-text {
            font-size: 11px;
            color: #666;
        }
        .value-text {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
            text-align: left;
            direction: ltr;
        }
        .med-name {
            text-align: center;
            background: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .med-name .label-text {
            margin-bottom: 5px;
        }
        .med-name .value-text {
            font-size: 16px;
            color: #7c3aed;
            text-align: center;
            direction: rtl;
        }
        .footer {
            text-align: center;
            border-top: 2px dashed #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .date {
            font-size: 10px;
            color: #888;
        }
        .barcode {
            font-family: 'Libre Barcode 39', monospace;
            font-size: 36px;
            text-align: center;
            margin: 10px 0;
            letter-spacing: 5px;
        }
        .id-number {
            font-size: 10px;
            color: #999;
            text-align: center;
        }
        .notes {
            background: #fef3c7;
            padding: 8px;
            border-radius: 5px;
            font-size: 11px;
            margin-top: 10px;
            text-align: center;
        }
        .print-btn {
            display: block;
            width: 100%;
            padding: 12px;
            margin-top: 20px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
        }
        .print-btn:hover {
            background: #6d28d9;
        }
        @media print {
            .print-btn {
                display: none;
            }
            body {
                padding: 0;
            }
            .label {
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="label">
        <div class="header">
            <div class="pharmacy-name">صيدلية الرازي</div>
            <div class="pharmacy-branch">الرس 1</div>
            <span class="type-badge">${isOrder ? '📦 طلب تحويل' : '💊 إعادة صرف'}</span>
        </div>

        <div class="content">
            <div class="row">
                <span class="label-text">اسم العميل:</span>
                <span class="value-text">${Utils.sanitize(p.name) || '-'}</span>
            </div>
            <div class="row">
                <span class="label-text">رقم الجوال:</span>
                <span class="value-text">${p.phone}</span>
            </div>

            <div class="med-name">
                <div class="label-text">${isOrder ? 'الصنف:' : 'الدواء:'}</div>
                <div class="value-text">${Utils.sanitize(p.med)}</div>
            </div>

            ${isOrder && p.branch ? `
            <div class="row">
                <span class="label-text">من فرع:</span>
                <span class="value-text">${p.branch}</span>
            </div>
            ` : ''}

            ${isOrder && p.pickupDate ? `
            <div class="row">
                <span class="label-text">تاريخ الاستلام:</span>
                <span class="value-text">${p.pickupDate}</span>
            </div>
            ` : ''}

            ${!isOrder && p.days ? `
            <div class="row">
                <span class="label-text">المدة:</span>
                <span class="value-text">${p.days} يوم</span>
            </div>
            ` : ''}

            ${p.notes ? `
            <div class="notes">📝 ${Utils.sanitize(p.notes)}</div>
            ` : ''}
        </div>

        <div class="footer">
            <div class="id-number">#${p.id.slice(-6)}</div>
            <div class="date">${today}</div>
        </div>
    </div>

    <button class="print-btn" onclick="window.print()">🖨️ طباعة</button>

    <script>
        // Auto print after a short delay
        setTimeout(() => {
            // window.print();
        }, 500);
    </script>
</body>
</html>
        `);

        printWindow.document.close();
    }
};
