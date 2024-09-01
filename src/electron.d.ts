interface ElectronAPI {
    fetchClientList: (callback: (clients: any[]) => void) => void;
    fetchSessionsList: (callback: (sessions: any[]) => void) => void;
    fetchParsedFile: (callback: (numbers: any[]) => void) => void;
    connectClient: (clientId: string, mainNumber: string) => void;
    clientListUpdate: (callback: (clients: any[]) => void) => void;
    whitelistListUpdate: (callback: (whitelist: any[]) => void) => void;
    startSession: (data: any) => void;
    whitelistNumbers: (data: any) => void;
    removeWhitelisted: (data: any) => void;
    sessionUpdate: (sessionId: string, status: string) => void;
    startConnection: (clientId: string) => void;
    pauseResumeSession: (clientId: string) => void;
    stopSession: (clientId: string) => void;
    onQRCode: (callback: (clientId: string, qr: string) => void) => void;
    requestClientQR: (callback: (clientId: string) => void) => void;
    parseExcel: (file: any) => string[];
    statusUpdate: (callback: () => void) => void;
    clearNumbers: () => void;
    onConnected: (callback: () => void) => void;
    removeClient: (clientId: string) => void;
}

interface Window {
    electron: ElectronAPI;
}