import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { Main } from './shitufon/main';
import path from 'path';
import { Client, LocalAuth } from 'whatsapp-web.js';
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

let mainWindow: BrowserWindow;
let main: Main;
const clients: { [id: string]: Client } = {}; // Store client instances
const sessions: any[] = []; // Store session info

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

async function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        icon: path.join(__dirname, 'assets', 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: true,
        }
    });

    
    mainWindow.loadFile('index.html');
    main = new Main(mainWindow, app.getPath('userData'));
    await main.init();
}

app.on('ready', async () => {
    autoUpdater.checkForUpdatesAndNotify();
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

autoUpdater.on('update-available', () => {
    log.info('Update available.');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available. Do you want to update now?',
        buttons: ['Yes', 'Later']
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    dialog.showMessageBox({
        title: 'Install Updates',
        message: 'Updates downloaded, application will be quit for update...'
    }).then(() => {
        autoUpdater.quitAndInstall();
    });
});

ipcMain.on('request-client-qr', (event, clientId) => {
});

// Fetch client IDs
ipcMain.handle('fetch-client-ids', async () => {
    return Object.keys(clients);
});

// Fetch parsed excel file
ipcMain.handle('fetch-parsed-file', async () => {
    return main.numbersData;
});

// Fetch running sessions
ipcMain.handle('fetch-running-sessions', async () => {
    return sessions;
});

ipcMain.on('excel-parsing', (event, file) => {
    return main.parseExcel(file);
});

ipcMain.on('clear-numbers', () => {
    return main.numbersData = [];
});

// Handle form submission
ipcMain.on('submit-form', async (event, data) => {
    const { clientIds, speed, selectedNumbers, messageBody } = data;
    const rate = speed === 'slow' ? 15000 : speed === 'medium' ? 6000 : 3000; // milliseconds per message
    await main.startSession(clientIds, rate, selectedNumbers, messageBody);
});

ipcMain.on('remove-client', async (event, clientId) => {
    await main.remove_client(clientId);
    mainWindow.webContents.send('fetch-client-list', clientId);
});

ipcMain.on('session-update', async (event, sesssionId, status) => {
    if (status === 'stopped') {
        return await main.stopSession(sesssionId);
    } else if (status === 'paused') {
        return await main.pauseSession(sesssionId);
    } else if (status === 'resumed') {
        return await main.resumeSession(sesssionId);
    }
    return;
});


ipcMain.handle('fetch-client-list', async () => {
    mainWindow.webContents.send('client-list-update');
    return main.get_clients_status();
});

ipcMain.handle('client-list-update', async () => {
    return main.get_conntected_clients();
});

ipcMain.handle('fetch-sessions-list', async () => {
    return main.get_sessions_status();
});

// Handle connection start
ipcMain.on('start-connection', async (event, clientId, mainNumber) => {
    await main.connect_client(clientId, mainNumber);
});

ipcMain.on('create-client', async (event, clientId, mainNumber) => {
    await main.connect_client(clientId, mainNumber);
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
