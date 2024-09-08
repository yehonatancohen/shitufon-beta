import { session } from 'electron';
import QRCode from 'qrcode';

// Populate client ID select box
export function populateClientIDSelect(clientIds: string[]) {
    const clientIdsSelect = document.getElementById('client-ids') as HTMLSelectElement;
    if (clientIdsSelect) {
        clientIdsSelect.innerHTML = ''; // Clear existing options

        clientIds.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            clientIdsSelect.appendChild(option);
        });
    }
}

export function populateWhitelist(numbers: string[]) {
    const tableBody = document.querySelector('#whitelisted-table tbody');
    const selectAllCheckbox = document.getElementById('select-all-checkbox-whitelisted') as HTMLInputElement;
    const selectedCountDiv = document.getElementById('selectedCount-whitelist') as HTMLDivElement;

    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing rows

        numbers.forEach((item, index) => {
            const row = document.createElement('tr');

            // Checkbox
            const cellCheckbox = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item;
            checkbox.classList.add('row-checkbox-whitelist');
            cellCheckbox.appendChild(checkbox);
            cellCheckbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.row-checkbox-whitelist:checked').length;
                selectedCountDiv.textContent = selectedCount.toString();
            });
            row.appendChild(cellCheckbox);

            // Mobile Number
            const cellMobile = document.createElement('td');
            cellMobile.textContent = item;
            row.appendChild(cellMobile);

            tableBody.appendChild(row);
        });

        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox-whitelist') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
}

// Function to render client list
export function renderClientList(clients: any[]) {
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
            ${client.status === 'qr' ? `<button class="styled-button" onclick="window.showQRCode('${client.id}')">Show QR</button>` : ''}
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

export function updateTimer(element: any, startTime: any, status: any, pausedTime: any) {
    let elapsedTime;

    if (status === 'Paused') {
        // When paused, use the time at which the session was paused
        elapsedTime = pausedTime - startTime;
    } else if (status === 'Stopped' || status === 'Done') {
        return;
    } else {
        // If not paused, calculate the elapsed time normally
        const now = Date.now();
        elapsedTime = now - startTime;
    }

    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    element.textContent = formattedTime;
}

export function renderSessionsList(sessions: any[]) {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    container.innerHTML = ''; // Clear existing panels
    Object.values(sessions).forEach(sessionData => {
        if (sessionData.type === 'Listening') return;
        if (sessionData.clients.length === 0) return;
        const panel = document.createElement('div');
        panel.classList.add('session-panel');

        const startTime = new Date(sessionData.startTime);
        const currentTime = new Date();
        const timeSinceStart = currentTime.getTime() - startTime.getTime();
        const secondsSinceStart = Math.floor(timeSinceStart / 1000);
        const minutesSinceStart = Math.floor(secondsSinceStart / 60);
        const hoursSinceStart = Math.floor(minutesSinceStart / 60);
        const daysSinceStart = Math.floor(hoursSinceStart / 24);

        const timeString = `${daysSinceStart}d ${hoursSinceStart % 24}h ${minutesSinceStart % 60}m ${secondsSinceStart % 60}s`;

        panel.innerHTML = `
          <div class="session-header">
              <h4>Session ID: <span>${sessionData.id}</span></h4>
              <p>Type: <span>${sessionData.type}</span></p>
              <button class="close-btn" onclick="removeSession('${sessionData.id}')">X</button>
          </div>
          <div class="session-info">
              <p>Time Since Start: <span class="timer-${sessionData.id}"></span></p>
              <p>Messages sent: <span>${sessionData.sentMessage}</span></p>
              <p>Messages left: <span>${sessionData.toSendMessage}</span></p>
              <p>Status: <span>${sessionData.status}</span></p>
          </div>
          <div class="session-controls">
              <button onclick="window.sessionUpdate('${sessionData.id}', '${sessionData.isPaused ? 'resumed' : 'paused'}')">${sessionData.isPaused ? 'Resume' : 'Pause'}</button>
              <button onclick="window.sessionUpdate('${sessionData.id}', 'stopped')">Stop</button>
          </div>
          <div class="client-ids">
              ${sessionData.clients.map((client: any) => `<span class="client-id">${client}</span>`).join('')}
          </div>
      `;

        panel.setAttribute('data-session-id', sessionData.id);

        container.appendChild(panel);

        const timerElement = panel.querySelector(`.timer-${sessionData.id}`);
        setInterval(() => {
            if (!sessionData.isPaused) {
                updateTimer(timerElement, sessionData.startTime, sessionData.status, sessionData.pausedTime);
            } else {
                updateTimer(timerElement, sessionData.startTime, sessionData.status, sessionData.paused);
            }
        }, 1000);

        panel.querySelector('.btn-start')?.addEventListener('click', () => {
            window.electron.sessionUpdate(sessionData.id, "resumed");
        });

        panel.querySelector('.btn-pause')?.addEventListener('click', () => {
            window.electron.sessionUpdate(sessionData.id, "paused");
        });

        panel.querySelector('.btn-stop')?.addEventListener('click', () => {
            window.electron.sessionUpdate(sessionData.id, "stopped");
        });
    });
}

export function populatePhoneNumbers(data: { mobile: string, name: string, fullName: string, gender: string }[] = []) {
    const tableBody = document.querySelector('#sending-table tbody');
    const selectAllCheckbox = document.getElementById('select-all-checkbox sending') as HTMLInputElement;
    const selectedCountDiv = document.getElementById('selectedCount-sending') as HTMLDivElement;

    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach((item, index) => {
            console.log(item);
            const row = document.createElement('tr');

            // Checkbox
            const cellCheckbox = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.mobile;
            checkbox.classList.add('row-checkbox-sending');
            cellCheckbox.appendChild(checkbox);
            cellCheckbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.row-checkbox-sending:checked').length;
                selectedCountDiv.textContent = 'Selected Numbers: ' + selectedCount.toString();
            });
            row.appendChild(cellCheckbox);

            // Mobile Number
            const cellMobile = document.createElement('td');
            cellMobile.textContent = item.mobile;
            row.appendChild(cellMobile);

            // Name
            const cellName = document.createElement('td');
            cellName.textContent = item.name;
            row.appendChild(cellName);

            // Full Name
            const cellFullName = document.createElement('td');
            cellFullName.textContent = item.fullName;
            row.appendChild(cellFullName);

            // Gender
            const cellGender = document.createElement('td');
            cellGender.textContent = item.gender;
            row.appendChild(cellGender);


            tableBody.appendChild(row);
        });

        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox-sending') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            const selectedCount = document.querySelectorAll('.row-checkbox-sending:checked').length;
            selectedCountDiv.textContent = 'Selected Numbers: ' + selectedCount.toString();
        });
    }
}

export function populateExcelTable(data: { mobile: string, name: string, fullName: string, gender: string }[] = []) {
    const tableBody = document.querySelector('#parsed-numbers-table tbody');
    const selectAllCheckbox = document.getElementById('select-all-checkbox') as HTMLInputElement;
    const selectedCountDiv = document.getElementById('selectedCount-whitelist-parse') as HTMLDivElement;

    if (tableBody) {
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach((item, index) => {
            const row = document.createElement('tr');

            // Checkbox
            const cellCheckbox = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.mobile;
            checkbox.classList.add('row-checkbox-whitelist-parse');
            cellCheckbox.appendChild(checkbox);
            cellCheckbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.row-checkbox-whitelist-parse:checked').length;
                selectedCountDiv.textContent = selectedCount.toString();
            });
            row.appendChild(cellCheckbox);

            // Mobile Number
            const cellMobile = document.createElement('td');
            cellMobile.textContent = item.mobile;
            row.appendChild(cellMobile);

            tableBody.appendChild(row);
        });

        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox-whitelist-parse') as NodeListOf<HTMLInputElement>;
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    }
}

export function showQr(clientId: string, qrCodes: { [clientId: string]: string }) {
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
export function showClientInfo(clientId: string) {
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

// Function to populate parsed numbers
export function populateParsedNumbers(numbers: string[]) {
    const parsedNumbersContainer = document.getElementById('parsed-numbers-list');
    if (parsedNumbersContainer) {
        parsedNumbersContainer.innerHTML = ''; // Clear existing numbers

        numbers.forEach(number => {
            const label = document.createElement('label');
            const div = document.createElement('div');
            div.className = 'phone-number';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = number;

            div.appendChild(checkbox);
            div.appendChild(document.createTextNode(number));
            parsedNumbersContainer.appendChild(div);
        });
    }
}