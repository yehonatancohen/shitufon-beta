import { BrowserWindow } from 'electron';

export class LogManager {
    private mainWindow: BrowserWindow;

    constructor(_mainWindow: BrowserWindow) {
        this.mainWindow = _mainWindow;
    }

    public info(message: string) {
        console.log(message);
        this.mainWindow.webContents.send('log', true, message);
    }

    public error(message: string) {
        console.log(message);
        this.mainWindow.webContents.send('log', false, message);
    }
}