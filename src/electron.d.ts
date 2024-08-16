interface ElectronAPI {
    fetchClientIds: (callback: (clientIds: string[]) => void) => void;
    fetchClientList: (callback: (clients: any[]) => void) => void;
    fetchSessionsList: (callback: (sessions: any[]) => void) => void;
    createClient: (clientId: string) => void;
    connectClient: (clientId: string) => void;
    clientListUpdate: (callback: (clients: any[]) => void) => void;
    sendForm: (data: any) => void;
    startConnection: (clientId: string) => void;
    pauseResumeSession: (clientId: string) => void;
    stopSession: (clientId: string) => void;
    onQRCode: (callback: (clientId: string, qr: string) => void) => void;
    requestClientQR: (callback: (clientId: string) => void) => void;
    parseExcel: (file: any) => string[];
    statusUpdate: (callback: () => void) => void;
    clearNumbers: () => void;
    onConnected: (callback: () => void) => void;
    fetchRunningSessions: (callback: (sessions: any[]) => void) => void;
    fetchParsedFile: (callback: (numbers: any[]) => void) => void;
    removeClient: (clientId: string) => void;
}

interface Window {
    electron: ElectronAPI;
}