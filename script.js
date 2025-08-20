// Get all necessary DOM elements
const countryCodeSelect = document.getElementById('countryCode');
const phoneNumberInput = document.getElementById('phoneNumber');
const messageTextarea = document.getElementById('messageText');
const validationIcon = document.getElementById('validation-icon');
const templateButtons = document.querySelectorAll('.template-btn');
const charCountSpan = document.getElementById('charCount');
const countryFlagSpan = document.getElementById('countryFlag');

// Data for countries and their phone number details
const countryData = {
    '91': { name: 'India', flag: '🇮🇳', length: 10 },
    '1': { name: 'USA', flag: '🇺🇸', length: 10 },
    '44': { name: 'UK', flag: '🇬🇧', length: 10 },
    '61': { name: 'Australia', flag: '🇦🇺', length: 9 },
    '81': { name: 'Japan', flag: '🇯🇵', length: 10 },
    '49': { name: 'Germany', flag: '🇩🇪', length: 10 }
};

// Event listeners for UI interaction
phoneNumberInput.addEventListener('input', validatePhoneNumber);
countryCodeSelect.addEventListener('change', () => {
    updateCountryFlag();
    validatePhoneNumber();
});
messageTextarea.addEventListener('input', updateCharCount);

// Event listeners for message template buttons
templateButtons.forEach(button => {
    button.addEventListener('click', () => {
        messageTextarea.value = button.dataset.template;
        updateCharCount();
    });
});

// Load saved data from local storage on page load
window.addEventListener('load', loadFromLocalStorage);

// Functions for the new features

// Function to update the character count
function updateCharCount() {
    const charCount = messageTextarea.value.length;
    charCountSpan.textContent = `${charCount} characters`;
}

// Function to update the country flag emoji
function updateCountryFlag() {
    const code = countryCodeSelect.value;
    countryFlagSpan.textContent = countryData[code].flag;
}

// Function to validate the phone number
function validatePhoneNumber() {
    const phoneNumber = phoneNumberInput.value;
    const countryCode = countryCodeSelect.value;
    const expectedLength = countryData[countryCode].length;
    let isValid = false;

    if (phoneNumber.length > 0) {
        if (phoneNumber.length === expectedLength && /^\d+$/.test(phoneNumber)) {
            isValid = true;
        }
    }
    
    if (phoneNumber.length > 0) {
        validationIcon.classList.remove('hidden');
        if (isValid) {
            validationIcon.classList.remove('invalid');
            validationIcon.classList.add('valid');
            validationIcon.innerHTML = '&#10003;';
        } else {
            validationIcon.classList.remove('valid');
            validationIcon.classList.add('invalid');
            validationIcon.innerHTML = '&#10007;';
        }
    } else {
        validationIcon.classList.add('hidden');
    }
}

// Function to save user data to local storage
function saveToLocalStorage() {
    const data = {
        countryCode: countryCodeSelect.value,
        phoneNumber: phoneNumberInput.value,
        message: messageTextarea.value
    };
    localStorage.setItem('whatsappSenderData', JSON.stringify(data));
}

// Function to load user data from local storage
function loadFromLocalStorage() {
    const storedData = localStorage.getItem('whatsappSenderData');
    if (storedData) {
        const data = JSON.parse(storedData);
        countryCodeSelect.value = data.countryCode;
        phoneNumberInput.value = data.phoneNumber;
        messageTextarea.value = data.message;
        
        // Update UI after loading data
        updateCountryFlag();
        updateCharCount();
        validatePhoneNumber();
    }
}

// Main function to send the WhatsApp message
function sendWhatsAppMessage() {
    const countryCode = countryCodeSelect.value;
    const phoneNumber = phoneNumberInput.value;
    const messageText = messageTextarea.value;

    if (!phoneNumber || !messageText || !document.getElementById('validation-icon').classList.contains('valid')) {
        alert('Please enter a valid phone number and message.');
        return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
    
    // Save data before opening the link
    saveToLocalStorage();

    window.open(whatsappUrl, '_blank');
}

// Function to copy the generated link to the clipboard
function copyWhatsAppLink() {
    const countryCode = countryCodeSelect.value;
    const phoneNumber = phoneNumberInput.value;
    const messageText = messageTextarea.value;

    if (!phoneNumber || !messageText || !document.getElementById('validation-icon').classList.contains('valid')) {
        alert('Please enter a valid phone number and message to generate a link.');
        return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    const encodedMessage = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;

    navigator.clipboard.writeText(whatsappUrl).then(() => {
        alert('WhatsApp link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Could not copy link. Please copy it manually.');
    });
}