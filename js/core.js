// State Management & Event Bus
export const State = {
    patients: [],
    editId: null,
    currentPage: 1,
    searchQuery: '',
    statusFilter: 'all',
    typeFilter: 'all',
    entryType: 'refill',
    searchTimeout: null,
    orderItems: [] // For local orders list
};

export const Config = {
    API_URL: 'https://script.google.com/macros/s/AKfycbzScqUsOESP_1EQZBqYvXLbkoOkNsDm2_o5twRHbU078-1e5HI7uSgmhDy_mkAmfLv-ig/exec',
    ITEMS_PER_PAGE: 10,
    SEARCH_DELAY: 300,
    TOAST_DURATION: 3000,
    PHONE_REGEX: /^(966|0)?5\d{8}$/,
    MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    BRANCH_EMAILS: {
        'RASS2': 'rass2@alraziksa.com',
        'RASS5': 'rass5@alraziksa.com',
        // ... (أضف باقي الإيميلات هنا كما كانت)
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
