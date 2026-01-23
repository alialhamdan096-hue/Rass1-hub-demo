export const State = {
    patients: [],
    editId: null,
    currentPage: 1,
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all',
    entryType: 'refill',
    searchTimeout: null,
    orderItems: [] 
};

export const Config = {
    // ⚠️ هذا هو الرابط الذي أرسلته لي مؤخراً
    API_URL: 'https://script.google.com/macros/s/AKfycbzc1pwzBZgkc-FjfCTAcOSCBDKKbK2gwYhvm4bjSZcRVFl03PuXPa8vxPHd9Yk2nENpUw/exec',
    
    ITEMS_PER_PAGE: 10,
    SEARCH_DELAY: 300,
    TOAST_DURATION: 3000,
    PHONE_REGEX: /^(966|0)?5\d{8}$/,
    MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    
    BRANCH_EMAILS: {
        'RASS2': 'rass2@alraziksa.com',
        'RASS5': 'rass5@alraziksa.com',
        'UNIZAH1': 'unizah1@alraziksa.com',
        'UNIZAH2': 'unizah2@alraziksa.com',
        'UNIZAH3': 'unizah3@alraziksa.com',
        'UNIZAH5': 'unizah5@alraziksa.com',
        'BADAYA1': 'badaya1@alraziksa.com',
        'BADAYA2': 'badaya2@alraziksa.com',
        'BADAYA3': 'badaya3@alraziksa.com',
        'BADAYA5': 'badaya5@alraziksa.com',
        'BADAYA.MOR': 'badaya.mor@alraziksa.com',
        'BUKAYRIAH1': 'bukayriah1@alraziksa.com',
        'BUKAYRIAH2': 'bukayriah2@alraziksa.com',
        'BUKAYRIAH.MOR': 'bukayriah.mor@alraziksa.com',
        'BURIDAH1': 'buridah1@alraziksa.com',
        'BURIDAH2': 'buridah2@alraziksa.com',
        'KHABRA1': 'khabra1@alraziksa.com',
        'MITHNAB1': 'mithnab1@alraziksa.com',
        'MITHNAB2': 'mithnab2@alraziksa.com',
        'RIYADH.KHABRA.MOR': 'riyadh.khabra.mor@alraziksa.com'
    }
};

const events = {};
export const Events = {
    on(event, callback) {
        if (!events[event]) events[event] = [];
        events[event].push(callback);
    },
    emit(event, data) {
        if (events[event]) events[event].forEach(cb => cb(data));
    }
};
