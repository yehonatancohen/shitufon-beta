import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    fetchClientList: (callback: (clients: any[]) => void) => {
        ipcRenderer.invoke('fetch-client-list').then(callback);
    },
    createClient: (clientId: string) => ipcRenderer.send('create-client', clientId),
    connectClient: (clientId: string) => ipcRenderer.send('connect-client', clientId),
    onClientListUpdate: (callback: (clients: any[]) => void) => ipcRenderer.on('client-list-update', (event, clients) => callback(clients)),
    sendForm: (data: any) => ipcRenderer.send('submit-form', data),
    startConnection: (clientId: string) => ipcRenderer.send('start-connection', clientId),
    pauseResumeSession: (clientId: string) => ipcRenderer.send('pause-resume-session', clientId),
    stopSession: (clientId: string) => ipcRenderer.send('stop-session', clientId),
    requestClientQR: (clientId: string) => ipcRenderer.send('request-client-qr', clientId),
    onQRCode: (callback: (clientId: string, qr: string) => void) => ipcRenderer.on('qr', (event, clientId, qr) => callback(clientId, qr)),
    onConnected: (callback: () => void) => ipcRenderer.on('connected', () => callback()),
    statusUpdate: (callback: () => void) => ipcRenderer.on('status-update', (event) => callback()),
    removeClient: (clientId: string) => ipcRenderer.send('remove-client', clientId),
    fetchRunningSessions: (callback: (sessions: any[]) => void) => {
        ipcRenderer.invoke('fetch-running-sessions').then(callback);
    }
});