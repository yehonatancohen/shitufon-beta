import { ipcMain } from 'electron';
import QRCode from 'qrcode';
import * as domControl from './domControl'

// Switching between tabs
const btnSending = document.getElementById('btn-sending');
const btnConnecting = document.getElementById('btn-connecting');
const btnClients = document.getElementById('btn-clients');
const btnWhitelist = document.getElementById('btn-whitelist');
const tabSending = document.getElementById('tab-sending');
const tabClients = document.getElementById('tab-clients');
const tabWhitelist = document.getElementById('tab-whitelist');
const tabConnecting = document.getElementById('tab-connecting');
const totalNumbersSpan = document.getElementById('total-numbers');
const selectedNumbersSpan = document.getElementById('selected-numbers');


const qrCodes: { [clientId: string]: string } = {};

function fetchAndRenderer() {
    window.electron.fetchClientList(domControl. renderClientList);
    window.electron.fetchSessionsList(domControl.renderSessionsList);
    window.electron.clientListUpdate(domControl.populateClientIDSelect);
    window.electron.whitelistListUpdate(domControl.populateWhitelist);
}

if (btnSending && btnConnecting && tabSending && tabConnecting && btnClients && tabClients) {
    const tabs = [tabSending, tabConnecting, tabClients, tabWhitelist];
    const buttons = [btnSending, btnConnecting, btnClients, btnWhitelist];

    buttons.forEach((button, index) => {
        button?.addEventListener('click', () => {
            tabs.forEach((tab, tabIndex) => {
                if (tabIndex === index) {
                    tab?.classList.add('active');
                } else {
                    tab?.classList.remove('active');
                }
            });

            buttons.forEach((btn, btnIndex) => {
                if (btnIndex === index) {
                    btn?.classList.add('active');
                } else {
                    btn?.classList.remove('active');
                }
            });
        });
    });

    // Initialize with sending tab active
    tabSending.classList.add('active');
    btnSending.classList.add('active');
}

// Handling the sending form
const sendingForm = document.getElementById('sending-form') as HTMLFormElement | null;
if (sendingForm) {
    sendingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const clientIdsElement = document.getElementById('client-ids') as HTMLSelectElement;
        const clientIds = Array.from(clientIdsElement.selectedOptions).map(option => option.value);
        const speed = (document.getElementById('speed') as HTMLSelectElement).value;
        const messageBody = (document.getElementById('message-body') as HTMLTextAreaElement).value;
        const selectedNumbers: any[] = [];
        const checkboxes = document.querySelectorAll('.row-checkbox');
    
        checkboxes.forEach((checkbox) => {
            const inputElcheckboxement = checkbox as HTMLInputElement;
            if (inputElcheckboxement?.checked) {
                selectedNumbers.push(inputElcheckboxement?.value);
            }
        });

        // Send data to the backend
        window.electron.startSession({ clientIds, speed, selectedNumbers, messageBody });
    });
}

function removeClient(clientId: string) {
    const confirmation = confirm('Are you sure you want to remove this client?');
    if (confirmation) {
        window.electron.removeClient(clientId);
        fetchAndRenderer();
    }
}

document.getElementById('upload-file-whitelist')?.addEventListener('change', event => {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result as string;
            window.electron.parseExcel(data);
            window.electron.fetchParsedFile(domControl.populateExcelTable);
        };
        reader.readAsArrayBuffer(file);
    }
});

document.getElementById('excel-file')?.addEventListener('change', event => {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result as string;
            window.electron.parseExcel(data);
            window.electron.fetchParsedFile(domControl.populatePhoneNumbers);
        };
        reader.readAsArrayBuffer(file);
    }
});

function showQRCode(clientId: string) {
    domControl.showQr(clientId, qrCodes);
}

// Close client info
function closeClientInfo(clientId: any) {
    const clientInfo = document.getElementById(`info-${clientId}`);
    if (clientInfo) {
        clientInfo.style.display = 'none';
    }
}

// Handle creating new client
const newClientForm = document.getElementById('new-client-form');
if (newClientForm) {
    newClientForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newClientId = (document.getElementById('new-client-id') as HTMLInputElement).value.trim();
        const mainNumber = (document.getElementById('main-number') as HTMLInputElement).value.trim();
        if (newClientId) {
            window.electron.connectClient(newClientId, mainNumber);
            fetchAndRenderer();
        }
    });
}

// Function to connect a client
function connectClient(clientId: string) {
    const mainNumber = (document.getElementById('main-number') as HTMLInputElement).value;
    window.electron.connectClient(clientId, mainNumber);
}

window.electron.statusUpdate(() => {
    fetchAndRenderer();
});

// Update QR code and connection status
window.electron.onQRCode((clientId, qr) => {
    const qrContainer = document.getElementById(`qr-container-${clientId}`);
    if (qrContainer) {
        qrCodes[clientId] = qr;
        qrContainer.dataset.qrCode = qr;
    } else {
        console.error(`QR container for client ${clientId} not found`);
    }
});

window.electron.onConnected(() => {
    const qrCodeImage = document.getElementById('qr-code') as HTMLImageElement;
    const connectionStatus = document.getElementById('connection-status') as HTMLParagraphElement;
    qrCodeImage.style.display = 'none';
    connectionStatus.style.display = 'block';
});

document.getElementById('whitelist-numbers')?.addEventListener('click', () => {
    const selectedNumbers: any[] = [];
    const checkboxes = document.querySelectorAll('.row-checkbox');

    checkboxes.forEach((checkbox) => {
        const inputElcheckboxement = checkbox as HTMLInputElement;
        if (inputElcheckboxement?.checked) {
            selectedNumbers.push(inputElcheckboxement?.value);
        }
    });
    
    // Whitelist numbers
    window.electron.whitelistNumbers(selectedNumbers);
    fetchAndRenderer();
});

// Function to handle text input
document.getElementById('parse-input')?.addEventListener('click', () => {
    const textInput = (document.getElementById('input-text') as HTMLTextAreaElement).value;
    const numbers = textInput.split('\n').map(num => num.trim()).filter(num => num.length > 0);
    domControl.populateParsedNumbers(numbers);
});

// Function to handle save parsed numbers
document.getElementById('save-parsed-numbers')?.addEventListener('click', () => {
    const selectedNumbers = Array.from(document.querySelectorAll('#parsed-numbers-list input[type="checkbox"]:checked'))
        .map(checkbox => (checkbox as HTMLInputElement).value);
    // update whitelist
    fetchAndRenderer();
});

// Function to toggle edit mode
document.getElementById('edit-whitelisted')?.addEventListener('click', () => {
    const editButton = document.getElementById('edit-whitelisted') as HTMLButtonElement;
    const saveButton = document.getElementById('save-whitelisted') as HTMLButtonElement;
    const whitelistedList = document.getElementById('whitelisted-list');

    if (whitelistedList) {
        whitelistedList.querySelectorAll('.phone-number input[type="checkbox"]').forEach(checkbox => {
            const checkboxElement = checkbox as HTMLInputElement;
            checkboxElement.disabled = !checkboxElement.disabled;
        });
    }

    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';
});

// Function to handle save whitelisted numbers
document.getElementById('save-whitelisted')?.addEventListener('click', () => {
    const whitelistedNumbers = Array.from(document.querySelectorAll('#whitelisted-list input[type="checkbox"]'))
        .map(checkbox => (checkbox as HTMLInputElement).value);
    // Implement save logic here

    // Toggle back to view mode
    document.getElementById('edit-whitelisted')!.style.display = 'inline-block';
    document.getElementById('save-whitelisted')!.style.display = 'none';
});

// Init
fetchAndRenderer();

function initWindow() {
    (window as any).showClientInfo = domControl.showClientInfo;
    (window as any).closeClientInfo = closeClientInfo;
    (window as any).connectClient = connectClient;
    (window as any).removeClient = removeClient;
    (window as any).showQRCode = showQRCode;
}

initWindow();