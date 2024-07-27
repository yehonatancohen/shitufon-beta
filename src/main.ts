import { app, BrowserWindow, ipcMain } from 'electron';
import { Main } from './shitufon/main';
import path from 'path';
import { Client, LocalAuth } from 'whatsapp-web.js';

let mainWindow: BrowserWindow;
let main: Main;
const clients: { [id: string]: Client } = {}; // Store client instances
const sessions: any[] = []; // Store session info

async function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    
    mainWindow.loadFile('index.html');
    main = new Main(mainWindow);
    await main.init();
}

app.on('ready', async () => {
    await createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
    }
});

ipcMain.on('request-client-qr', (event, clientId) => {
});

// Fetch client IDs
ipcMain.handle('fetch-client-ids', async () => {
    return Object.keys(clients);
});

// Fetch running sessions
ipcMain.handle('fetch-running-sessions', async () => {
    return sessions;
});

// Handle form submission
ipcMain.on('submit-form', (event, data) => {
    const { clientIds, speed, mainNumber, messageBody } = data;
    const rate = speed === 'slow' ? 15000 : speed === 'medium' ? 6000 : 3000; // milliseconds per message
    /*
    clientIds.forEach((clientId: string) => {
        const client = clients[clientId];
        if (client) {
            const session = {
                clientId,
                messagesSent: 0,
                timeRunning: 0,
                isPaused: false
            };
            sessions.push(session);
            const interval = setInterval(() => {
                if (session.isPaused) return;
                client.sendMessage(mainNumber, messageBody).then(() => {
                    session.messagesSent++;
                }).catch(console.error);
            }, rate);
        }
    });*/
});

ipcMain.on('remove-client', async (event, clientId) => {
    await main.remove_client(clientId);
    mainWindow.webContents.send('fetch-client-list', clientId);
});

ipcMain.handle('fetch-client-list', async () => {
    return main.get_clients_status();
});

// Handle connection start
ipcMain.on('start-connection', async (event, clientId) => {
    await main.connect_client(clientId, "0586181898");
});

ipcMain.on('create-client', async (event, clientId) => {
    await main.connect_client(clientId, "0586181898");
});

// Handle pause/resume session
ipcMain.on('pause-resume-session', (event, clientId) => {
    const session = sessions.find(s => s.clientId === clientId);
    if (session) {
        session.isPaused = !session.isPaused;
    }
});

// Handle stop session
ipcMain.on('stop-session', (event, clientId) => {
    const sessionIndex = sessions.findIndex(s => s.clientId === clientId);
    if (sessionIndex > -1) {
        clearInterval(sessions[sessionIndex].interval);
        sessions.splice(sessionIndex, 1);
    }
});
