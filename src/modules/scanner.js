/**
 * Barcode Scanner Module for Rass1 Hub
 * Uses Html5-QRCode library for barcode scanning
 * For Vite project structure
 */
// Offers data - will be loaded from Google Sheets
let offersData = [];
export const Scanner = {
    scanner: null,
    isScanning: false,
    audioContext: null,
    isMobile: false,
    /**
     * Check if device is mobile
     */
    checkIsMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },
    /**
     * Initialize the scanner
     */
    async init() {
        // Create scanner modal if not exists
        if (!document.getElementById('scannerModal')) {
            this.createScannerModal();
        }
        // Load offers data
        await this.loadOffersData();
    },
    /**
     * Create the scanner modal HTML
     */
    createScannerModal() {
        const modalHTML = `
            <div id="scannerModal" class="scanner-modal">
                <div class="scanner-modal-content">
                    <div class="scanner-header">
                        <h2 id="scannerModalTitle">📷 Scan Barcode</h2>
                        <button id="closeScannerBtn" class="scanner-close-btn">&times;</button>
                    </div>
                    
                    <!-- Camera Section (Mobile) -->
                    <div id="cameraSection">
                        <div id="scannerPreview" class="scanner-preview"></div>
                        <p class="scanner-hint">Point your camera at the product barcode</p>
                    </div>
                    
                    <!-- Manual Search Section -->
                    <div class="manual-search-section">
                        <div class="manual-search-divider" id="searchDivider">
                            <span>أو ابحث يدوياً</span>
                        </div>
                        <div class="manual-search-input">
                            <input type="text" id="manualSearchInput" placeholder="أدخل الباركود أو اسم المنتج..." autofocus />
                            <button id="manualSearchBtn" class="scanner-btn primary">🔍 بحث</button>
                        </div>
                    </div>
                    
                    <div class="scanner-actions" id="cameraActions">
                        <button id="switchCameraBtn" class="scanner-btn secondary">🔄 Switch Camera</button>
                        <button id="stopScanBtn" class="scanner-btn danger">Stop Scanning</button>
                    </div>
                </div>
            </div>
            
            <div id="offerResultModal" class="scanner-modal">
                <div class="scanner-modal-content offer-result">
                    <div class="scanner-header">
                        <h2 id="offerResultTitle">🎉 Offer Found!</h2>
                        <button id="closeOfferBtn" class="scanner-close-btn">&times;</button>
                    </div>
                    <div id="offerResultContent" class="offer-content"></div>
                    <div class="scanner-actions">
                        <button id="scanAgainBtn" class="scanner-btn primary">🔍 بحث جديد</button>
                        <button id="closeOfferResultBtn" class="scanner-btn secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindEvents();
    },
    /**
     * Bind modal events
     */
    bindEvents() {
        document.getElementById('closeScannerBtn')?.addEventListener('click', () => this.stop());
        document.getElementById('stopScanBtn')?.addEventListener('click', () => this.stop());
        document.getElementById('closeOfferBtn')?.addEventListener('click', () => this.closeOfferResult());
        document.getElementById('closeOfferResultBtn')?.addEventListener('click', () => this.closeOfferResult());
        document.getElementById('scanAgainBtn')?.addEventListener('click', () => {
            this.closeOfferResult();
            if (this.isMobile) this.start();
        });
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        // Robust Input Handling
        const manualInput = document.getElementById('manualSearchInput');
        const manualBtn = document.getElementById('manualSearchBtn');
        if (manualInput) {
            // 1. Pause scanner when focused (fixes keyboard issue)
            manualInput.addEventListener('focus', () => {
                if (this.isScanning && this.scanner) {
                    try { this.scanner.pause(true); } catch (e) { }
                }
            });
            // 2. Search on Enter
            manualInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    manualInput.blur();
                    this.manualSearch();
                }
            });
        }
        if (manualBtn) {
            manualBtn.addEventListener('click', (e) => {
                e.preventDefault();
                manualInput?.blur();
                this.manualSearch();
            });
        }
        document.getElementById('scannerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'scannerModal') this.stop();
        });
    },
    /**
     * Load offers data from Google Sheets
     */
    async loadOffersData() {
        try {
            const sheetId = '1-_6mN6DpmuUbpgy3q3h-RXRjPepfhhcdIx2K3oybCzw';
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
            const response = await fetch(url);
            const text = await response.text();
            const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/)?.[1];
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                offersData = this.parseGoogleSheetsData(data);
                console.log(`✅ Loaded ${offersData.length} offers from Google Sheets`);
            }
        } catch (error) {
            console.warn('Could not load from Google Sheets, using fallback data:', error);
            offersData = this.getSampleData();
        }
    },
    parseGoogleSheetsData(data) {
        const rows = data.table.rows;
        return rows.slice(1).map(row => {
            const cells = row.c;
            // Extract date - Google Sheets returns dates in special format or serial numbers
            const extractDate = (cell) => {
                if (!cell) return '';
                // 1. Try formatted value (most reliable)
                if (cell.f && cell.f !== '∞') return cell.f;
                if (cell.v !== null && cell.v !== undefined) {
                    const vs = String(cell.v);
                    // Case: Date(2026,8,6)
                    const m = vs.match(/Date\((\d+),(\d+),(\d+)\)/);
                    if (m) return `${parseInt(m[2]) + 1}/${m[3]}/${m[1]}`;
                    // Case: Serial number (e.g. 45683)
                    if (!isNaN(cell.v) && cell.v > 40000 && cell.v < 60000) {
                        const d = new Date((cell.v - 25569) * 86400000);
                        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
                    }
                    return vs;
                }
                return '';
            };
            return {
                barcode: cells[0]?.v?.toString() || '',
                productName: cells[1]?.v || '',
                brand: cells[2]?.v || '',
                discount: cells[3]?.v || cells[3]?.f || '',
                priceBefore: cells[4]?.v || cells[4]?.f || '',
                save: cells[5]?.v || cells[5]?.f || '',
                priceAfter: cells[6]?.v || cells[6]?.f || '',
                startDate: extractDate(cells[8]),
                endDate: extractDate(cells[9]),
                arDescription: cells[10]?.v || '',
                type: cells[11]?.v || '',
                category: cells[12]?.v || ''
            };
        }).filter(item => item.barcode);
    },
    /**
     * Parse date string safely (handles MM/DD/YYYY and other formats)
     */
    parseDate(dateStr) {
        if (!dateStr || dateStr === '∞' || String(dateStr).toLowerCase().includes('inf') || dateStr === '') {
            return null;
        }
        try {
            // 1. Try standard date parse
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
            // 2. Manual parse for D/M/Y or M/D/Y
            const parts = String(dateStr).split(/[\/\-.]/);
            if (parts.length === 3) {
                const p0 = parseInt(parts[0]);
                const p1 = parseInt(parts[1]);
                const y = parseInt(parts[2]);
                if (y > 1000) {
                    if (p0 > 12) return new Date(y, p1 - 1, p0); // D/M/Y
                    return new Date(y, p0 - 1, p1); // M/D/Y (Default)
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    /**
     * Get status object for an offer
     */
    getOfferStatus(offer) {
        // Special case: Fixed/Static type
        if (offer.type === 'ثابت') {
            return {
                status: 'active',
                label: '✅ ساري',
                color: '#27ae60',
                message: 'عرض مستمر'
            };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Parse dates safely
        const startDate = this.parseDate(offer.startDate);
        const endDate = this.parseDate(offer.endDate);
        // Check if not started yet
        if (startDate && startDate > today) {
            const diff = Math.ceil((startDate - today) / 86400000);
            return {
                status: 'not_started',
                label: '🔜 لم يبدأ',
                color: '#95a5a6',
                message: `بعد ${diff} يوم`
            };
        }
        // Check if expired
        if (endDate && endDate < today) {
            return {
                status: 'expired',
                label: '❌ منتهي',
                color: '#e74c3c',
                message: 'انتهى'
            };
        }
        // Active offer with end date
        if (endDate) {
            const diff = Math.ceil((endDate - today) / 86400000);
            if (diff <= 3) {
                return {
                    status: 'ending_soon',
                    label: '⚡ ينتهي قريباً',
                    color: '#f39c12',
                    message: `${diff} يوم`
                };
            }
            return {
                status: 'active',
                label: '✅ ساري',
                color: '#27ae60',
                message: `${diff} يوم`
            };
        }
        // Active offer without end date (Continuous)
        return {
            status: 'active',
            label: '✅ ساري',
            color: '#27ae60',
            message: 'مستمر'
        };
    },
    getSampleData() {
        return [
            {
                barcode: '3616303321932',
                productName: 'ADIDAS ICE DIVE NATURAL SPRAY 100ML',
                brand: 'ADIDAS',
                discount: '20.00%',
                priceBefore: '48',
                save: '9.6',
                priceAfter: '38.47',
                arDescription: 'بخاخ أديداس آيس دايف الطبيعي 100 مل',
                category: 'COSMETICS'
            }
        ];
    },
    /**
     * Start barcode scanning
     */
    async start() {
        await this.init();
        this.isMobile = this.checkIsMobile();
        const modal = document.getElementById('scannerModal');
        const cameraSection = document.getElementById('cameraSection');
        const cameraActions = document.getElementById('cameraActions');
        const searchDivider = document.getElementById('searchDivider');
        const modalTitle = document.getElementById('scannerModalTitle');
        const searchInput = document.getElementById('manualSearchInput');
        modal.classList.add('active');
        // Desktop mode - search only, no camera
        if (!this.isMobile) {
            modalTitle.textContent = '🔍 البحث عن العروض';
            cameraSection.style.display = 'none';
            cameraActions.style.display = 'none';
            searchDivider.style.display = 'none';
            // Focus on search input
            setTimeout(() => searchInput?.focus(), 100);
            return;
        }
        // Mobile mode - camera + search
        modalTitle.textContent = '📷 مسح الباركود';
        cameraSection.style.display = 'block';
        cameraActions.style.display = 'flex';
        searchDivider.style.display = 'flex';
        try {
            if (typeof Html5Qrcode === 'undefined') {
                await this.loadHtml5QrcodeLib();
            }
            this.scanner = new Html5Qrcode('scannerPreview');
            const config = {
                fps: 20,
                qrbox: { width: 300, height: 150 },
                aspectRatio: 1.777778,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };
            await this.scanner.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => this.onScanSuccess(decodedText),
                () => { }
            );
            this.isScanning = true;
        } catch (error) {
            console.error('Scanner start error:', error);
            cameraSection.style.display = 'none';
            cameraActions.style.display = 'none';
            searchDivider.style.display = 'none';
            modalTitle.textContent = '🔍 البحث عن العروض';
            setTimeout(() => searchInput?.focus(), 100);
        }
    },
    loadHtml5QrcodeLib() {
        return new Promise((resolve, reject) => {
            if (typeof Html5Qrcode !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    async stop() {
        if (this.scanner && this.isScanning) {
            try {
                await this.scanner.stop();
            } catch (e) { }
        }
        this.isScanning = false;
        document.getElementById('scannerModal')?.classList.remove('active');
    },
    async switchCamera() {
        if (!this.scanner || !this.isScanning) return;
        try {
            await this.scanner.stop();
            const currentFacing = this.scanner.getState()?.facingMode || 'environment';
            const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
            await this.scanner.start(
                { facingMode: newFacing },
                {
                    fps: 20,
                    qrbox: { width: 300, height: 150 },
                    aspectRatio: 1.777778,
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                },
                (decodedText) => this.onScanSuccess(decodedText),
                () => { }
            );
        } catch (error) {
            console.error('Camera switch error:', error);
        }
    },
    onScanSuccess(barcode) {
        console.log('📷 Scanned barcode:', barcode);
        this.playBeepSound();
        this.stop();
        const offer = this.lookupOffer(barcode);
        this.showResult(barcode, offer);
    },
    playBeepSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.value = 1800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.log('Beep error:', e);
        }
    },
    lookupOffer(barcode) {
        return offersData.find(item => item.barcode === barcode);
    },
    searchByName(query) {
        const lowerQuery = query.toLowerCase();
        return offersData.filter(item =>
            item.productName?.toLowerCase().includes(lowerQuery) ||
            item.arDescription?.toLowerCase().includes(lowerQuery) ||
            item.brand?.toLowerCase().includes(lowerQuery) ||
            item.category?.toLowerCase().includes(lowerQuery)
        );
    },
    manualSearch() {
        const input = document.getElementById('manualSearchInput');
        const query = input?.value?.trim();
        if (!query) return;
        this.stop();
        let offer = this.lookupOffer(query);
        if (offer) {
            this.showResult(query, offer);
        } else {
            const results = this.searchByName(query);
            if (results.length === 1) {
                this.showResult(results[0].barcode, results[0]);
            } else if (results.length > 1) {
                this.showMultipleResults(results);
            } else {
                this.showResult(query, null);
            }
        }
        if (input) input.value = '';
    },
    showMultipleResults(results) {
        const modal = document.getElementById('offerResultModal');
        const title = document.getElementById('offerResultTitle');
        const content = document.getElementById('offerResultContent');
        title.textContent = `🔍 تم العثور على ${results.length} نتائج`;
        title.style.color = '#3498db';
        let html = '<div class="search-results">';
        results.forEach((item, index) => {
            html += `
                <div class="search-result-item" onclick="window.Scanner.selectResult(${index})" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">
                    <div style="font-weight: bold; color: #667eea;">${item.brand || ''}</div>
                    <div style="color: #fff; margin: 5px 0;">${item.productName}</div>
                    <div style="font-size: 0.9em; color: #2ecc71;">${item.priceAfter} SAR <span style="text-decoration: line-through; color: #95a5a6; font-size: 0.8em; margin-left:10px;">${item.priceBefore} SAR</span></div>
                </div>
            `;
        });
        html += '</div>';
        content.innerHTML = html;
        modal.classList.add('active');
        this.searchResults = results;
        window.Scanner = this; // Ensure onclick works
    },
    selectResult(index) {
        if (this.searchResults && this.searchResults[index]) {
            this.showResult(this.searchResults[index].barcode, this.searchResults[index]);
        }
    },
    showResult(barcode, offer) {
        const modal = document.getElementById('offerResultModal');
        const title = document.getElementById('offerResultTitle');
        const content = document.getElementById('offerResultContent');
        if (offer) {
            const status = this.getOfferStatus(offer);
            title.textContent = '🎉 تم العثور على العرض!';
            title.style.color = '#27ae60';
            content.innerHTML = `
                <div class="offer-card">
                    <div class="offer-status-banner" style="background: ${status.color}; padding: 10px; border-radius: 10px; margin-bottom: 15px; text-align: center; color: white;">
                        <span style="font-weight: bold;">${status.label}</span> | <span>${status.message}</span>
                    </div>
                    <div class="offer-product" style="text-align: center; margin-bottom: 15px;">
                        <span style="background: #667eea; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; color: white;">${offer.brand}</span>
                        <h3 style="color: white; margin: 10px 0;">${offer.productName}</h3>
                        <p style="color: #95a5a6; font-size: 0.9em;">${offer.arDescription || ''}</p>
                    </div>
                    <div class="offer-pricing" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #95a5a6;">السعر الأصلي:</span>
                            <span style="text-decoration: line-through; color: #e74c3c;">${offer.priceBefore} SAR</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #95a5a6;">الخصم:</span>
                            <span style="background: #e74c3c; padding: 2px 6px; border-radius: 5px; font-size: 0.9em; color: white;">${offer.discount}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 10px;">
                            <span style="font-weight: bold; color: white;">السعر العرض:</span>
                            <span style="font-size: 1.4em; font-weight: bold; color: #2ecc71;">${offer.priceAfter} SAR</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            title.textContent = '❌ لم يتم العثور على العرض';
            title.style.color = '#e74c3c';
            content.innerHTML = `
                <div style="text-align: center; color: white; padding: 20px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px; font-family: monospace;">
                        ${barcode}
                    </div>
                    <p>هذا المنتج لا يوجد له عرض حالياً في قاعدة البيانات.</p>
                </div>
            `;
        }
        modal.classList.add('active');
    },
    closeOfferResult() {
        document.getElementById('offerResultModal')?.classList.remove('active');
    }
};
export default Scanner;
