/**
 * WhatsApp Bulk Sender Pro - Core Logic
 */

// State Management
const state = {
    activeTab: 'single',
    bulkContacts: [],
    history: JSON.parse(localStorage.getItem('ws_history')) || [],
    settings: JSON.parse(localStorage.getItem('ws_settings')) || { delay: 2, autoSave: true },
    templates: JSON.parse(localStorage.getItem('ws_templates')) || [
        { id: 1, name: 'Product Inquiry', text: "Hi, I'm interested in your product." },
        { id: 2, name: 'Availability', text: "Hello, is this still available?" },
        { id: 3, name: 'General Thanks', text: "Thanks for your time!" }
    ]
};

// DOM Elements
const elements = {
    tabs: document.querySelectorAll('.nav-item'),
    tabContents: document.querySelectorAll('.tab-content'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    
    // Single Send
    countryCode: document.getElementById('countryCode'),
    phoneNumber: document.getElementById('phoneNumber'),
    messageText: document.getElementById('messageText'),
    charCount: document.getElementById('charCount'),
    templatesQuickList: document.getElementById('templates-list'),
    
    // Bulk Send
    dropArea: document.getElementById('drop-area'),
    fileInput: document.getElementById('fileInput'),
    bulkControls: document.getElementById('bulk-controls'),
    bulkQueue: document.getElementById('bulk-queue'),
    contactCount: document.getElementById('contact-count'),
    
    // Management
    historyList: document.getElementById('history-list'),
    manageTemplatesList: document.getElementById('manage-templates-list'),
    
    // Settings
    sendDelay: document.getElementById('sendDelay'),
    autoSaveHistory: document.getElementById('autoSaveHistory')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFileUpload();
    initCharCounter();
    updateHistoryUI();
    updateTemplatesUI();
    loadSettingsUI();
});

// --- Tab Navigation ---
function initTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchTab(target);
        });
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    elements.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    elements.tabContents.forEach(content => {
        content.style.display = content.id === `tab-${tabId}` ? 'block' : 'none';
    });
    
    const titles = {
        single: { t: 'Single Send', s: 'Send a quick message to any WhatsApp number.' },
        bulk: { t: 'Bulk Send', s: 'Upload a CSV and reach multiple people at once.' },
        history: { t: 'History', s: 'Track your recent messaging activity.' },
        templates: { t: 'Templates', s: 'Manage your frequently used messages.' },
        settings: { t: 'Settings', s: 'Configure your preferences.' }
    };
    
    elements.pageTitle.textContent = titles[tabId]?.t || 'WSender Pro';
    elements.pageSubtitle.textContent = titles[tabId]?.s || '';
}

// --- Single Send Logic ---
function initCharCounter() {
    elements.messageText.addEventListener('input', () => {
        elements.charCount.textContent = `${elements.messageText.value.length} characters`;
    });
}

function sendWhatsAppMessage() {
    const code = elements.countryCode.value;
    const rawNum = elements.phoneNumber.value;
    const num = rawNum.startsWith('+') ? rawNum.replace(/\D/g, '') : `${code}${rawNum.replace(/\D/g, '')}`;
    const msg = elements.messageText.value;

    if (!rawNum || !msg) return alert('Please provide both phone number and message.');

    const fullUrl = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    if (state.settings.autoSave) saveToHistory(num, msg);
    window.open(fullUrl, '_blank');
}

function copyWhatsAppLink() {
    const code = elements.countryCode.value;
    const rawNum = elements.phoneNumber.value;
    const num = rawNum.startsWith('+') ? rawNum.replace(/\D/g, '') : `${code}${rawNum.replace(/\D/g, '')}`;
    const msg = elements.messageText.value;

    if (!rawNum || !msg) return alert('Fill details first.');

    const fullUrl = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
}

// --- Bulk Send Logic ---
function initFileUpload() {
    elements.dropArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleCSV(file);
    });
}

function handleCSV(file) {
    Papa.parse(file, {
        header: true,
        complete: (results) => {
            state.bulkContacts = results.data.filter(row => row.number || row.phone);
            renderBulkQueue();
            elements.bulkControls.style.display = 'block';
            elements.contactCount.textContent = state.bulkContacts.length;
        },
        error: (err) => alert('Error parsing CSV: ' + err.message)
    });
}

function renderBulkQueue() {
    elements.bulkQueue.innerHTML = state.bulkContacts.map((contact, index) => `
        <div class="queue-item">
            <div>
                <strong>${contact.name || 'Unknown'}</strong>
                <div class="text-dim" style="font-size: 0.8rem;">${contact.number || contact.phone}</div>
            </div>
            <span class="status-badge status-pending">Pending</span>
        </div>
    `).join('');
}

function startBulkSending() {
    const baseMsg = elements.messageText.value;
    if (!baseMsg) return alert('Please enter a message template first.');

    const delay = state.settings.delay * 1000;
    alert(`Sending ${state.bulkContacts.length} messages with a ${state.settings.delay}s delay. Please allow popups.`);

    state.bulkContacts.forEach((contact, index) => {
        setTimeout(() => {
            let msg = baseMsg.replace(/{name}/g, contact.name || '');
            let rawNum = (contact.number || contact.phone).toString();
            let num = rawNum.startsWith('+') ? rawNum.replace(/\D/g, '') : `${elements.countryCode.value}${rawNum.replace(/\D/g, '')}`;
            
            const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
            
            const items = elements.bulkQueue.querySelectorAll('.queue-item');
            if (items[index]) {
                const badge = items[index].querySelector('.status-badge');
                badge.className = 'status-badge status-sent';
                badge.textContent = 'Sent';
            }

            if (state.settings.autoSave) saveToHistory(num, msg);
        }, index * delay);
    });
}

function clearBulkList() {
    state.bulkContacts = [];
    elements.bulkQueue.innerHTML = '';
    elements.bulkControls.style.display = 'none';
}

// --- History Logic ---
function saveToHistory(number, message) {
    const entry = {
        id: Date.now(),
        number,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        time: new Date().toLocaleString()
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 20);
    localStorage.setItem('ws_history', JSON.stringify(state.history));
    updateHistoryUI();
}

function updateHistoryUI() {
    if (!elements.historyList) return;
    if (state.history.length === 0) {
        elements.historyList.innerHTML = '<p class="text-dim">No history yet.</p>';
        return;
    }
    elements.historyList.innerHTML = state.history.map(item => `
        <div class="queue-item">
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${item.number}</strong>
                    <span class="text-dim" style="font-size: 0.7rem;">${item.time}</span>
                </div>
                <div class="text-dim" style="font-size: 0.8rem;">${item.message}</div>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    state.history = [];
    localStorage.removeItem('ws_history');
    updateHistoryUI();
}

// --- Template Logic ---
function updateTemplatesUI() {
    // Quick List in Single Send
    elements.templatesQuickList.innerHTML = state.templates.map(t => `
        <button class="btn btn-secondary template-btn" data-template="${t.text}">${t.name}</button>
    `).join('');

    // Add click listeners to new buttons
    elements.templatesQuickList.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.messageText.value = btn.dataset.template;
            elements.charCount.textContent = `${elements.messageText.value.length} characters`;
        });
    });

    // Management List
    elements.manageTemplatesList.innerHTML = state.templates.map(t => `
        <div class="queue-item">
            <div style="flex: 1;">
                <strong>${t.name}</strong>
                <div class="text-dim" style="font-size: 0.8rem;">${t.text.substring(0, 60)}...</div>
            </div>
            <button class="btn btn-secondary" onclick="deleteTemplate(${t.id})" style="padding: 0.5rem;"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function addNewTemplate() {
    const name = prompt('Template Name:');
    const text = prompt('Template Message:');
    if (name && text) {
        state.templates.push({ id: Date.now(), name, text });
        localStorage.setItem('ws_templates', JSON.stringify(state.templates));
        updateTemplatesUI();
    }
}

function deleteTemplate(id) {
    state.templates = state.templates.filter(t => t.id !== id);
    localStorage.setItem('ws_templates', JSON.stringify(state.templates));
    updateTemplatesUI();
}

// --- Settings Logic ---
function loadSettingsUI() {
    elements.sendDelay.value = state.settings.delay;
    elements.autoSaveHistory.checked = state.settings.autoSave;
}

function saveSettings() {
    state.settings.delay = parseInt(elements.sendDelay.value);
    state.settings.autoSave = elements.autoSaveHistory.checked;
    localStorage.setItem('ws_settings', JSON.stringify(state.settings));
    alert('Settings saved!');
}
