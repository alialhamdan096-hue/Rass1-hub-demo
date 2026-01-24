import { State } from '../state.js';
import { Utils } from '../utils/helpers.js';

// ==================== PATIENT HISTORY MODULE ====================
export const PatientHistory = {
    show(id) {
        const p = State.patients.find(x => x.id === id);
        if (!p) return;

        const modal = document.getElementById('historyModal');
        const content = document.getElementById('historyContent');

        document.getElementById('historyPatientName').textContent = p.name || p.phone;
        document.getElementById('historyPatientPhone').textContent = p.phone;
        document.getElementById('historyPatientMed').textContent = p.med;

        let html = '';

        // Current cycle
        html += `
            <div class="history-section">
                <div class="history-section-title">📍 الدورة الحالية</div>
                <div class="history-item current">
                    <div class="history-item-row">
                        <span class="history-label">تاريخ الصرف:</span>
                        <span class="history-value">${p.date || '-'}</span>
                    </div>
                    <div class="history-item-row">
                        <span class="history-label">المدة:</span>
                        <span class="history-value">${p.days || '-'} يوم</span>
                    </div>
                    <div class="history-item-row">
                        <span class="history-label">تاريخ الإضافة:</span>
                        <span class="history-value">${p.addedDate || '-'}</span>
                    </div>
                    ${p.reminderSent === 'yes' ? `
                    <div class="history-item-row">
                        <span class="history-label">📤 تذكير:</span>
                        <span class="history-value">${p.reminderDate || '-'}</span>
                    </div>
                    ` : ''}
                    ${p.converted === 'yes' ? `
                    <div class="history-item-row">
                        <span class="history-label">✅ تحويل:</span>
                        <span class="history-value">${p.convertedDate || '-'}</span>
                    </div>
                    ` : ''}
                    ${p.notes ? `
                    <div class="history-item-row">
                        <span class="history-label">📝 ملاحظات:</span>
                        <span class="history-value">${Utils.sanitize(p.notes)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Previous cycles
        const history = p.history || [];
        if (history.length > 0) {
            html += `
                <div class="history-section">
                    <div class="history-section-title">📜 السجل السابق (${history.length} دورة)</div>
            `;

            history.slice().reverse().forEach((h, index) => {
                html += `
                    <div class="history-item">
                        <div class="history-cycle-num">#${history.length - index}</div>
                        <div class="history-item-row">
                            <span class="history-label">تاريخ الصرف:</span>
                            <span class="history-value">${h.date || '-'}</span>
                        </div>
                        ${h.reminderDate ? `
                        <div class="history-item-row">
                            <span class="history-label">📤 تذكير:</span>
                            <span class="history-value">${h.reminderDate}</span>
                        </div>
                        ` : ''}
                        ${h.convertedDate ? `
                        <div class="history-item-row">
                            <span class="history-label">✅ تحويل:</span>
                            <span class="history-value">${h.convertedDate}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
            });

            html += '</div>';
        } else {
            html += `
                <div class="history-section">
                    <div class="history-empty">لا يوجد سجل سابق</div>
                </div>
            `;
        }

        // Stats summary
        const totalCycles = history.length + 1;
        const totalReminders = history.filter(h => h.reminderDate).length + (p.reminderSent === 'yes' ? 1 : 0);
        const totalConverted = history.filter(h => h.convertedDate).length + (p.converted === 'yes' ? 1 : 0);

        html += `
            <div class="history-stats">
                <div class="history-stat">
                    <div class="history-stat-num">${totalCycles}</div>
                    <div class="history-stat-label">دورة</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${totalReminders}</div>
                    <div class="history-stat-label">تذكير</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${totalConverted}</div>
                    <div class="history-stat-label">تحويل</div>
                </div>
                <div class="history-stat">
                    <div class="history-stat-num">${totalReminders > 0 ? Math.round(totalConverted / totalReminders * 100) : 0}%</div>
                    <div class="history-stat-label">معدل</div>
                </div>
            </div>
        `;

        content.innerHTML = html;
        modal.classList.add('active');
    },

    close() {
        document.getElementById('historyModal').classList.remove('active');
    }
};
