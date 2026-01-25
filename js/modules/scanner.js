/**
 * Barcode Scanner Module for Rass1 Hub
 * Uses Html5-QRCode library for barcode scanning
 */
import { UI } from './ui.js';
// Offers data - will be loaded from Google Sheets API or embedded JSON
let offersData = [];
export const Scanner = {
    scanner: null,
    isScanning: false,
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
                        <h2>📷 Scan Barcode</h2>
                        <button id="closeScannerBtn" class="scanner-close-btn">&times;</button>
                    </div>
                    <div id="scannerPreview" class="scanner-preview"></div>
                    <p class="scanner-hint">Point your camera at the product barcode</p>
                    <div class="scanner-actions">
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
                        <button id="scanAgainBtn" class="scanner-btn primary">📷 Scan Again</button>
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
        // Close scanner modal
        document.getElementById('closeScannerBtn')?.addEventListener('click', () => this.stop());
        document.getElementById('stopScanBtn')?.addEventListener('click', () => this.stop());
        // Close offer result modal
        document.getElementById('closeOfferBtn')?.addEventListener('click', () => this.closeOfferResult());
        document.getElementById('closeOfferResultBtn')?.addEventListener('click', () => this.closeOfferResult());
        // Scan again
        document.getElementById('scanAgainBtn')?.addEventListener('click', () => {
            this.closeOfferResult();
            this.start();
        });
        // Switch camera
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        // Close on backdrop click
        document.getElementById('scannerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'scannerModal') this.stop();
        });
        document.getElementById('offerResultModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'offerResultModal') this.closeOfferResult();
        });
    },
    /**
     * Load offers data from Google Sheets or embedded JSON
     */
    async loadOffersData() {
        try {
            // Try to fetch from Google Sheets API (public CSV export)
            const sheetId = '1-_6mN6DpmuUbpgy3q3h-RXRjPepfhhcdIx2K3oybCzw';
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
            const response = await fetch(url);
            const text = await response.text();
            // Parse Google Sheets JSON response (remove prefix/suffix)
            const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/)?.[1];
            if (jsonStr) {
                const data = JSON.parse(jsonStr);
                offersData = this.parseGoogleSheetsData(data);
                console.log(`✅ Loaded ${offersData.length} offers from Google Sheets`);
            }
        } catch (error) {
            console.warn('Could not load from Google Sheets, using fallback data:', error);
            // Fallback to embedded sample data
            offersData = this.getSampleData();
        }
    },
    /**
     * Parse Google Sheets API response
     */
    parseGoogleSheetsData(data) {
        const rows = data.table.rows;
        const cols = data.table.cols;
        // Skip header row, map data
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
                brandOrProduct: cells[7]?.v || '',
                fromDate: cells[8]?.v || '',
                toDate: cells[9]?.v || '',
                arDescription: cells[10]?.v || '',
                type: cells[11]?.v || '',
                category: cells[12]?.v || '',
                magazine: cells[13]?.v || ''
            };
        }).filter(item => item.barcode);
    },
    /**
     * Get sample fallback data
     */
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
                category: 'COSMETICS',
                type: 'ثابت'
            },
            {
                barcode: '3337875597197',
                productName: 'CERAVE FOAMING CLEANSER 236 ML',
                brand: 'CERAVE',
                discount: '40.00%',
                priceBefore: '71',
                save: '',
                priceAfter: '42.65',
                arDescription: 'غسول سيرافي الرغوي 236 مل',
                category: 'MEDICAL',
                type: 'ثابت'
            }
        ];
    },
    /**
     * Start barcode scanning
     */
    async start() {
        await this.init();
        const modal = document.getElementById('scannerModal');
        modal.classList.add('active');
        try {
            this.scanner = new Html5Qrcode('scannerPreview');
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            };
            await this.scanner.start(
                { facingMode: 'environment' },
                config,
                (decodedText) => this.onScanSuccess(decodedText),
                (errorMessage) => { } // Ignore scan errors
            );
            this.isScanning = true;
        } catch (error) {
            console.error('Scanner start error:', error);
            UI.showToast?.('Camera access denied or not available', 'error');
            this.stop();
        }
    },
    /**
     * Stop scanning
     */
    async stop() {
        if (this.scanner && this.isScanning) {
            try {
                await this.scanner.stop();
            } catch (e) {
                console.warn('Scanner already stopped');
            }
        }
        this.isScanning = false;
        const modal = document.getElementById('scannerModal');
        modal?.classList.remove('active');
    },
    /**
     * Switch between front and back camera
     */
    async switchCamera() {
        if (!this.scanner || !this.isScanning) return;
        try {
            await this.scanner.stop();
            // Toggle camera
            const currentFacing = this.scanner.getState()?.facingMode || 'environment';
            const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
            await this.scanner.start(
                { facingMode: newFacing },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => this.onScanSuccess(decodedText),
                () => { }
            );
        } catch (error) {
            console.error('Camera switch error:', error);
        }
    },
    /**
     * Handle successful barcode scan
     */
    onScanSuccess(barcode) {
        console.log('📷 Scanned barcode:', barcode);
        // Stop scanning
        this.stop();
        // Lookup offer
        const offer = this.lookupOffer(barcode);
        // Show result
        this.showResult(barcode, offer);
    },
    /**
     * Lookup offer by barcode
     */
    lookupOffer(barcode) {
        return offersData.find(item => item.barcode === barcode);
    },
    /**
     * Show scan result
     */
    showResult(barcode, offer) {
        const modal = document.getElementById('offerResultModal');
        const title = document.getElementById('offerResultTitle');
        const content = document.getElementById('offerResultContent');
        if (offer) {
            title.textContent = '🎉 Offer Found!';
            title.style.color = '#27ae60';
            content.innerHTML = `
                <div class="offer-card">
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
                        ${offer.save ? `
                        <div class="price-row save">
                            <span>You Save:</span>
                            <span class="save-amount">${offer.save} SAR</span>
                        </div>
                        ` : ''}
                        <div class="price-row final">
                            <span>Final Price:</span>
                            <span class="price final-price">${offer.priceAfter} SAR</span>
                        </div>
                    </div>
                    
                    <div class="offer-meta">
                        <span class="category-badge">${offer.category || 'General'}</span>
                        ${offer.type === 'NEW' ? '<span class="new-badge">NEW</span>' : ''}
                        ${offer.magazine === 'MAGAZINE' ? '<span class="magazine-badge">📰 In Magazine</span>' : ''}
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
    /**
     * Close offer result modal
     */
    closeOfferResult() {
        const modal = document.getElementById('offerResultModal');
        modal?.classList.remove('active');
    }
};
// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add scan button click handler if exists
    const scanBtn = document.getElementById('scanBarcodeBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => Scanner.start());
    }
});
export default Scanner;
