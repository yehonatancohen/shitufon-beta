import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    fetchClientList: (callback: (clients: any[]) => void) => {
        ipcRenderer.invoke('fetch-client-list').then(callback);
    },
    fetchSessionsList: (callback: (sessions: any[]) => void) => {
        ipcRenderer.invoke('fetch-sessions-list').then(callback);
    },
    fetchParsedFile: (callback: (numbers: any[]) => void) => {
        ipcRenderer.invoke('fetch-parsed-file').then(callback);
    },
    whitelistListUpdate: (callback: (numbers: any[]) => void) => {
        ipcRenderer.invoke('fetch-whitelist-list').then(callback);
    },
    connectClient: (clientId: string, mainNumber: string) => ipcRenderer.send('connect-client', clientId, mainNumber),
    clearNumbers: () => ipcRenderer.send('clear-numbers'),
    clientListUpdate: (callback: (clients: any[]) => void) => {
        ipcRenderer.invoke('client-list-update').then(callback);
    },
    startSession: (data: any) => ipcRenderer.send('start-session', data),
    whitelistNumbers: (data: any) => ipcRenderer.send('whitelist-numbers', data),
    removeWhitelisted: (data: any) => ipcRenderer.send('remove-whitelisted-numbers', data),
    parseExcel: (file: any) => ipcRenderer.send('excel-parsing', file),
    startConnection: (clientId: string) => ipcRenderer.send('start-connection', clientId),
    pauseResumeSession: (clientId: string) => ipcRenderer.send('pause-resume-session', clientId),
    stopSession: (clientId: string) => ipcRenderer.send('stop-session', clientId),
    requestClientQR: (clientId: string) => ipcRenderer.send('request-client-qr', clientId),
    onQRCode: (callback: (clientId: string, qr: string) => void) => ipcRenderer.on('qr', (event, clientId, qr) => callback(clientId, qr)),
    onConnected: (callback: () => void) => ipcRenderer.on('connected', () => callback()),
    statusUpdate: (callback: () => void) => ipcRenderer.on('status-update', (event) => callback()),
    sessionUpdate: (sessionId: string, status: string) => ipcRenderer.send('session-update', sessionId, status),
    removeClient: (clientId: string) => ipcRenderer.send('remove-client', clientId)
});