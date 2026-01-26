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
            this.start();
        });
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        // Manual search events
        document.getElementById('manualSearchBtn')?.addEventListener('click', () => this.manualSearch());
        document.getElementById('manualSearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.manualSearch();
        });
        document.getElementById('scannerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'scannerModal') this.stop();
        });
        document.getElementById('offerResultModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'offerResultModal') this.closeOfferResult();
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
            return {
                barcode: cells[0]?.v?.toString() || '',
                productName: cells[1]?.v || '',
                brand: cells[2]?.v || '',
                discount: cells[3]?.v || '',
                priceBefore: cells[4]?.v || '',
                save: cells[5]?.v || '',
                priceAfter: cells[6]?.v || '',
                startDate: cells[8]?.v || '', // From Datetime (Column I)
                endDate: cells[9]?.v || '',   // To Datetime (Column J)
                arDescription: cells[10]?.v || '',
                category: cells[12]?.v || ''
            };
        }).filter(item => item.barcode);
    },
    /**
     * Get offer status based on dates
     */
    getOfferStatus(offer) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Parse start date
        let startDate = null;
        if (offer.startDate) {
            startDate = new Date(offer.startDate);
        }
        // Parse end date (∞ means infinite/no end)
        let endDate = null;
        if (offer.endDate && offer.endDate !== '∞' && offer.endDate !== 'infinity') {
            endDate = new Date(offer.endDate);
        }
        // Check if not started yet
        if (startDate && startDate > today) {
            const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
            return {
                status: 'not_started',
                label: '🔜 لم يبدأ بعد',
                labelEn: 'Not Started',
                color: '#95a5a6',
                message: `يبدأ بعد ${daysUntilStart} يوم`,
                startDate: startDate.toLocaleDateString('ar-SA')
            };
        }
        // Check if expired
        if (endDate && endDate < today) {
            return {
                status: 'expired',
                label: '❌ منتهي',
                labelEn: 'Expired',
                color: '#e74c3c',
                message: 'انتهى هذا العرض'
            };
        }
        // Check if ending soon (within 3 days)
        if (endDate) {
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 3) {
                return {
                    status: 'ending_soon',
                    label: '⚠️ قارب على الانتهاء',
                    labelEn: 'Ending Soon',
                    color: '#f39c12',
                    message: `باقي ${daysLeft} يوم فقط!`,
                    daysLeft: daysLeft
                };
            }
        }
        // Offer is active
        if (endDate) {
            const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            return {
                status: 'active',
                label: '✅ ساري',
                labelEn: 'Active',
                color: '#27ae60',
                message: `متبقي ${daysLeft} يوم`,
                daysLeft: daysLeft
            };
        }
        // Infinite offer (no end date)
        return {
            status: 'active',
            label: '✅ ساري',
            labelEn: 'Active',
            color: '#27ae60',
            message: 'عرض مستمر'
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
            searchDivider.style.display = 'none';  // Hide "or search" text
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
            // Check if Html5Qrcode is loaded
            if (typeof Html5Qrcode === 'undefined') {
                // Load the library dynamically
                await this.loadHtml5QrcodeLib();
            }
            this.scanner = new Html5Qrcode('scannerPreview');
            // Optimized config for faster and more accurate scanning
            const config = {
                fps: 15,  // Increased from 10 - faster scanning
                qrbox: { width: 300, height: 180 },  // Larger scan area
                aspectRatio: 1.777,  // 16:9 for better camera view
                disableFlip: false,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.DATA_MATRIX
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true  // Use native API if available (faster)
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
            // If camera fails, just show search mode
            cameraSection.style.display = 'none';
            cameraActions.style.display = 'none';
            searchDivider.style.display = 'none';
            modalTitle.textContent = '🔍 البحث عن العروض';
            setTimeout(() => searchInput?.focus(), 100);
        }
    },
    /**
     * Load Html5-QRCode library dynamically
     */
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
                    fps: 15,
                    qrbox: { width: 300, height: 180 },
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
        this.playBeepSound();  // Play scan sound
        this.stop();
        const offer = this.lookupOffer(barcode);
        this.showResult(barcode, offer);
    },
    /**
     * Play beep sound like real barcode scanner
     */
    playBeepSound() {
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            // Configure beep sound
            oscillator.frequency.value = 1800;  // High frequency beep
            oscillator.type = 'square';  // Sharp beep sound
            // Volume envelope (quick fade out)
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            // Play beep
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);  // 100ms beep
            // Optional: Add a second quick beep for authentic scanner feel
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 2200;  // Slightly higher
                osc2.type = 'square';
                gain2.gain.setValueAtTime(0.2, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.08);
            }, 50);
        } catch (e) {
            console.log('Could not play beep sound:', e);
        }
    },
    lookupOffer(barcode) {
        return offersData.find(item => item.barcode === barcode);
    },
    /**
     * Search by product name
     */
    searchByName(query) {
        const lowerQuery = query.toLowerCase();
        return offersData.filter(item =>
            item.productName?.toLowerCase().includes(lowerQuery) ||
            item.arDescription?.toLowerCase().includes(lowerQuery) ||
            item.brand?.toLowerCase().includes(lowerQuery)
        );
    },
    /**
     * Manual search handler
     */
    manualSearch() {
        const input = document.getElementById('manualSearchInput');
        const query = input?.value?.trim();
        if (!query) {
            alert('الرجاء إدخال الباركود أو اسم المنتج');
            return;
        }
        this.stop();
        // First try exact barcode match
        let offer = this.lookupOffer(query);
        if (offer) {
            this.showResult(query, offer);
        } else {
            // Try search by name
            const results = this.searchByName(query);
            if (results.length === 1) {
                this.showResult(results[0].barcode, results[0]);
            } else if (results.length > 1) {
                this.showMultipleResults(results);
            } else {
                this.showResult(query, null);
            }
        }
        // Clear input
        if (input) input.value = '';
    },
    /**
     * Show multiple search results
     */
    showMultipleResults(results) {
        const modal = document.getElementById('offerResultModal');
        const title = document.getElementById('offerResultTitle');
        const content = document.getElementById('offerResultContent');
        title.textContent = `🔍 تم العثور على ${results.length} نتائج`;
        title.style.color = '#3498db';
        let html = '<div class="search-results">';
        results.forEach((item, index) => {
            html += `
                <div class="search-result-item" onclick="Scanner.selectResult(${index})" data-index="${index}">
                    <div class="result-brand">${item.brand || ''}</div>
                    <div class="result-name">${item.productName}</div>
                    <div class="result-price">
                        <span class="old-price">${item.priceBefore} SAR</span>
                        <span class="new-price">${item.priceAfter} SAR</span>
                        <span class="discount-tag">${item.discount}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        content.innerHTML = html;
        modal.classList.add('active');
        // Store results for selection
        this.searchResults = results;
    },
    /**
     * Select a result from multiple results
     */
    selectResult(index) {
        if (this.searchResults && this.searchResults[index]) {
            const item = this.searchResults[index];
            this.showResult(item.barcode, item);
        }
    },
    showResult(barcode, offer) {
        const modal = document.getElementById('offerResultModal');
        const title = document.getElementById('offerResultTitle');
        const content = document.getElementById('offerResultContent');
        if (offer) {
            const offerStatus = this.getOfferStatus(offer);
            title.textContent = '🎉 Offer Found!';
            title.style.color = '#27ae60';
            content.innerHTML = `
                <div class="offer-card">
                    <div class="offer-status-banner" style="background: ${offerStatus.color}">
                        <span class="status-label">${offerStatus.label}</span>
                        <span class="status-message">${offerStatus.message}</span>
                    </div>
                    <div class="offer-product">
                        <span class="offer-brand">${offer.brand}</span>
                        <h3>${offer.productName}</h3>
                        <p class="offer-ar">${offer.arDescription || ''}</p>
                    </div>
                    <div class="offer-pricing">
                        <div class="price-row original">
                            <span>Original Price:</span>
                            <span class="price strikethrough">${offer.priceBefore} SAR</span>
                        </div>
                        <div class="price-row discount">
                            <span>Discount:</span>
                            <span class="discount-badge">${offer.discount}</span>
                        </div>
                        ${offer.save ? `<div class="price-row save"><span>You Save:</span><span class="save-amount">${offer.save} SAR</span></div>` : ''}
                        <div class="price-row final">
                            <span>Final Price:</span>
                            <span class="price final-price">${offer.priceAfter} SAR</span>
                        </div>
                    </div>
                    <div class="offer-meta">
                        <span class="category-badge">${offer.category || 'General'}</span>
                    </div>
                </div>
            `;
        } else {
            title.textContent = '❌ No Offer Found';
            title.style.color = '#e74c3c';
            content.innerHTML = `
                <div class="no-offer">
                    <div class="barcode-display">
                        <span>Scanned Barcode:</span>
                        <code>${barcode}</code>
                    </div>
                    <p>This product does not have an active offer at the moment.</p>
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
