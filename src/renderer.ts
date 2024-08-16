import { ipcMain } from 'electron';
import QRCode from 'qrcode';

// Switching between tabs
const btnSending = document.getElementById('btn-sending');
const btnConnecting = document.getElementById('btn-connecting');
const tabSending = document.getElementById('tab-sending');
const tabConnecting = document.getElementById('tab-connecting');
const totalNumbersSpan = document.getElementById('total-numbers');
const selectedNumbersSpan = document.getElementById('selected-numbers');


const qrCodes: { [clientId: string]: string } = {};

function updateSummary(selectedNumbers: string[]) {
    if (!totalNumbersSpan || !selectedNumbersSpan) return;
    totalNumbersSpan.textContent = `Total Numbers: undefined`;
    selectedNumbersSpan.textContent = `Selected Numbers: ${selectedNumbers.length}`;
}

if (btnSending && btnConnecting && tabSending && tabConnecting) {
    btnSending.addEventListener('click', () => {
        tabSending.classList.add('active');
        tabConnecting.classList.remove('active');
        btnSending.classList.add('active');
        btnConnecting.classList.remove('active');
    });

    btnConnecting.addEventListener('click', () => {
        tabConnecting.classList.add('active');
        tabSending.classList.remove('active');
        btnConnecting.classList.add('active');
        btnSending.classList.remove('active');
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
        const selectedNumbers = $('#phone-numbers').val();
        const mainNumber = (document.getElementById('main-number') as HTMLInputElement).value;
        const messageBody = (document.getElementById('message-body') as HTMLTextAreaElement).value;

        // Send data to the backend
        console.log(messageBody);
        window.electron.sendForm({ clientIds, speed, selectedNumbers, mainNumber, messageBody });
        //window.electron.fetchSessionsList(renderSessionsList);
    });
    document.getElementById('phone-numbers')?.addEventListener('change', () => {
        const selectedNumbers = Array.from(document.querySelectorAll('#phone-numbers input[type="checkbox"]:checked'))
        .map(checkbox => (checkbox as HTMLInputElement).value);
        updateSummary(selectedNumbers);
    });
    document.getElementById('select-all-numbers')?.addEventListener('click', () => {
        $('#phone-numbers > option').prop('selected', 'selected');
        $('#phone-numbers').trigger('change');
    });
    
    document.getElementById('deselect-all-numbers')?.addEventListener('click', () => {
        $('#phone-numbers > option').prop('selected', false);
        $('#phone-numbers').trigger('change');
    });
    
    document.getElementById('clear-numbers')?.addEventListener('click', () => {
        $('#phone-numbers').empty().trigger('change');
    });
}

function showClientQR(clientId: string) {
    const qrContainer = document.getElementById(`qr-container-${clientId}`);
    if (qrContainer) {
        let qrCodeImage = document.getElementById(`qr-code-${clientId}`) as HTMLImageElement;
        if (!qrCodeImage) {
            qrCodeImage = document.createElement('img');
            qrCodeImage.id = `qr-code-${clientId}`;
            qrCodeImage.style.display = 'block';
            qrContainer.appendChild(qrCodeImage);
        }
        const qrData = qrCodes[clientId];
        if (qrData) {
            qrCodeImage.src = qrData;
        }
    }
}

// Populate client ID select box
function populateClientIDSelect(clients: any[]) {
    const clientIdSelect = document.getElementById('client-ids');
    if (!clientIdSelect) return;
    if (clients == undefined || clients.length === 0) 
        return clientIdSelect.innerHTML = '<option value="" disabled>No clients available</option>';
    clientIdSelect.innerHTML = ''; // Clear existing options

    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client;
        option.text = client;
        clientIdSelect.appendChild(option);
    });
}

// Function to render client list
function renderClientList(clients: any[]) {
    const clientList = document.getElementById('client-list');
    if (!clientList) return;
    clientList.innerHTML = clients.map(client => `
        <div class="client-item">
          <span>${client.id}</span>
          <span class="client-status" id="status-${client.id}">
            ${client.status === 'connected' ? '<span class="status-indicator" style="color: green;"><i class="fas fa-check"></i> Connected</span>' :
            client.status === 'connecting' ? '<span class="loading-circle"></span> Connecting' :
            client.status === 'opening' ? '<span class="loading-circle"></span> Opening Client' :
            client.status === 'qr' ? '<span class="loading-circle"></span> Waiting for QR scan' :
                `<button onclick="window.connectClient('${client.id}')">Connect</button>`}
          </span>
          <div>
            <button class="styled-button" onclick="window.showClientInfo('${client.id}')">Info</button>
            ${client.status === 'qr' ? `<button class="styled-button" onclick="window.showQRCodeMiddle('${client.id}')">Show QR</button>` : ''}
            <button class="styled-button remove-button" onclick="window.removeClient('${client.id}')">Remove</button>
          </div>
        </div>
        <div id="info-${client.id}" class="client-info">
            <p>Client ID: ${client.id}</p>
            <p>Status: ${client.status}</p>
            <div id="qr-container-${client.id}"></div> 
            <button class="close-button" onclick="window.closeClientInfo('${client.id}')">Close</button>
        </div>
      `).join('');
}

function renderSessionsList(sessions: any[]) {
    const container = document.getElementById('running-sessions');
    if (!container) return;
    container.innerHTML = ''; // Clear existing panels

    sessions.forEach(sessionData => {
        const panel = document.createElement('div');
        panel.classList.add('session-panel');

        panel.innerHTML = `
            <div class="session-header">
                <h4>Session ID: <span>${sessionData.id}</span></h4>
                <p>Type: <span>${sessionData.type}</span></p>
            </div>
            <div class="session-info">
                <p>Time Since Start: <span>${sessionData.time}</span></p>
                <p>Messages Sent: <span>${sessionData.messagesSent}</span></p>
                <p>Messages Received: <span>${sessionData.messagesReceived}</span></p>
            </div>
            <div class="session-controls">
                <button class="btn btn-start">Start</button>
                <button class="btn btn-pause">Pause</button>
                <button class="btn btn-stop">Stop</button>
            </div>
            <div class="client-ids">
                ${sessionData.clients.map((client: any) => `<span class="client-id">${client}</span>`).join('')}
            </div>
        `;

        container.appendChild(panel);
    });
}

function removeClient(clientId: string) {
    const confirmation = confirm('Are you sure you want to remove this client?');
    if (confirmation) {
        window.electron.removeClient(clientId);
        window.electron.fetchClientList(renderClientList);
        window.electron.clientListUpdate(populateClientIDSelect);
    }
}

// Fetch and render client list
window.electron.fetchClientList(renderClientList);
window.electron.fetchSessionsList(renderSessionsList);
window.electron.clientListUpdate(populateClientIDSelect);


(window as any).showClientInfo = showClientInfo;
(window as any).closeClientInfo = closeClientInfo;
(window as any).connectClient = connectClient;
(window as any).showClientQR = showClientQR;
(window as any).removeClient = removeClient;
(window as any).showQRCodeMiddle = showQRCodeMiddle;

document.getElementById('excel-file')?.addEventListener('change', event => {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result as string;
            window.electron.parseExcel(data);
            window.electron.fetchParsedFile(populatePhoneNumbers);
        };
        reader.readAsArrayBuffer(file);
    }
});

function populatePhoneNumbers1(numbers: string[] = []) {
    const phoneNumbersContainer = document.getElementById('phone-numbers');
    if (phoneNumbersContainer) {
        phoneNumbersContainer.innerHTML = '';
        numbers.forEach(number => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = number;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(number));
            phoneNumbersContainer.appendChild(label);
        });
    }
}

function populatePhoneNumbers(numbers: string[] = []) {
    const select = document.getElementById('phone-numbers');
    numbers.forEach(number => {
        const option = document.createElement('option');
        option.value = number;
        option.text = number;
        select?.appendChild(option);
    });
    $('#phoneNumbers').select2();
}

document.getElementById('select-all-numbers')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#phone-numbers input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const checkboxElement = checkbox as HTMLInputElement;
        checkboxElement.checked = true;
    });
});

document.getElementById('clear-numbers')?.addEventListener('click', () => {
    window.electron.clearNumbers();
    populatePhoneNumbers();
});

document.getElementById('deselect-all-numbers')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#phone-numbers input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const checkboxElement = checkbox as HTMLInputElement;
        checkboxElement.checked = false;
    });
});

function showQRCodeMiddle(clientId: string) {
    var qrContainer = document.getElementById("qr-container-".concat(clientId));
    if (!qrContainer) {
        console.error('QR container not found');
        return;
    }

    const qrData = qrCodes[clientId];
    if (!qrData) {
        console.error('QR data is not available');
        return;
    }
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.id = 'qr-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    // Create QR code image
    const qrCodeImage = document.createElement('img');
    qrCodeImage.id = `qr-code-middle-${clientId}`;
    qrCodeImage.style.display = 'block';

    // Generate QR code
    QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' }, (err, url) => {
        if (err) {
            console.error(err);
            return;
        }
        qrCodeImage.src = url;
    });

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '20px';
    closeButton.style.right = '20px';
    closeButton.style.padding = '10px 20px';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => {
        document.body.removeChild(overlay);
    };

    // Append elements to overlay
    overlay.appendChild(qrCodeImage);
    overlay.appendChild(closeButton);

    // Append overlay to body
    document.body.appendChild(overlay);
}
  

// Show client info
function showClientInfo(clientId: string) {
    const clientInfo = document.getElementById(`info-${clientId}`);
    if (clientInfo) {
        clientInfo.style.display = 'block';

        // Ensure QR code is displayed in the client info section
        const qrContainer = document.getElementById(`qr-container-${clientId}`);
        if (qrContainer) {
            let qrCodeImage = document.getElementById(`qr-code-${clientId}`) as HTMLImageElement;
            if (!qrCodeImage) {
                qrCodeImage = document.createElement('img');
                qrCodeImage.id = `qr-code-${clientId}`;
                qrCodeImage.style.display = 'block';
                qrContainer.appendChild(qrCodeImage);
            }
            const qrData = qrContainer.dataset.qrCode;
            if (qrData) {
                QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' }, (err, url) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    qrCodeImage.src = url;
                });
            }
        }
    }
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
        if (newClientId) {
            window.electron.createClient(newClientId);
            window.electron.fetchClientList(renderClientList);
            window.electron.clientListUpdate(populateClientIDSelect);
        }
    });
}

// Function to connect a client
function connectClient(clientId: string) {
    window.electron.connectClient(clientId);
}

window.electron.statusUpdate(() => {
    window.electron.fetchClientList(renderClientList);
    window.electron.fetchSessionsList(renderSessionsList);
    window.electron.clientListUpdate(populateClientIDSelect);
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

// Fetch running sessions from the backend and populate the sessions list
window.electron.fetchRunningSessions((sessions: any[]) => {
    const sessionsList = document.getElementById('sessions-list') as HTMLUListElement;
    if (sessionsList) {
        sessionsList.innerHTML = sessions.map(session => `
      <li>
        Client ID: ${session.clientId}, Messages Sent: ${session.messagesSent}, Time Running: ${session.timeRunning}
        <button onclick="pauseResumeSession('${session.clientId}')">${session.isPaused ? 'Resume' : 'Pause'}</button>
        <button onclick="stopSession('${session.clientId}')">Stop</button>
      </li>
    `).join('');
    }
});

// Define pauseResumeSession and stopSession functions
function pauseResumeSession(clientId: string) {
    window.electron.pauseResumeSession(clientId);
}

function stopSession(clientId: string) {
    window.electron.stopSession(clientId);
}