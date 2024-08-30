import { BrowserWindow } from 'electron';

export class LogManager {
    private mainWindow: BrowserWindow;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
    }

    public info(message: string) {
        console.log(message);
        this.mainWindow.webContents.send('log-info', message);
    }

    public error(message: string) {
        console.log(message);
        this.mainWindow.webContents.send('log-error', message);
    }
}