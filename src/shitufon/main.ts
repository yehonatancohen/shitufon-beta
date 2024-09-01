import { markAsUntransferable } from 'worker_threads';
import { BrowserWindow } from 'electron';
import path from 'path';
import { extractPhoneNumbers } from './Excel'
import { ClientsManager } from './ClientsManager';
import { SessionManager } from './sessions/SessionManager';
import fs from 'fs';

export class Main {
    public numbersData: {}[] = [];
    private clientIds: string[];
    private clientManager: ClientsManager;
    private sessionManager: SessionManager;
    private mainWindow: BrowserWindow;
    private mainNumber = '';
    private clientsPath = '';
    private whitelistPath = '';
    constructor(mainWindow: BrowserWindow, userDataPath: string) {
        this.mainWindow = mainWindow;
        this.clientIds = [];
        this.clientManager = new ClientsManager(this.mainWindow, userDataPath);
        this.mainWindow.webContents.send('fetch-client-list');
        this.sessionManager = new SessionManager(this.clientManager, this.mainNumber, []);
        this.clientsPath = path.join(userDataPath, 'clients.txt');
        this.whitelistPath = path.join(userDataPath, 'whitelist.txt');
    }
    
    public async init() {
        // Start all the clients
        this.get_clients();
        const promises = this.clientIds.map((clientId) => this.connect_client(clientId));
        await Promise.all(promises);
    }

    public get_conntected_clients() {
        this.get_clients();
        const connectedClients = this.clientIds.filter(clientId => this.clientManager.clients[clientId]?.connected);
        return connectedClients;
    }

    public get_sessions_status() {
        return this.sessionManager.getSessions();
    }

    public get_clients_status() {
        this.get_clients();
        const clientsStatus: { id: string, status: string }[] = [];
        for (let clientId of this.clientIds) {
            if (!this.clientManager.clients[clientId]) {
                clientsStatus.push({ id: clientId, status: 'disconnected' });
                continue;
            }
            const client = this.clientManager.clients[clientId];
            let status = client.status;
            clientsStatus.push({ id: clientId, status });
        }
        return clientsStatus;
    }

    public async check_connections() {
        this.get_clients();
        let connected = await this.clientManager.check_connections();
        return connected;
    }

    public parseExcel(file: any) {
        //data: { mobile: string, name: string, fullName: string }[]
        const number = extractPhoneNumbers(file, this.whitelistPath);
        this.numbersData.push(...number);
    }

    public get_clients() {
        try {
            const clients = fs.readFileSync(this.clientsPath, 'utf-8').split('\n').map(client => client.trim());
            this.clientIds.push(...clients.filter(client => client.trim() !== '' && !this.clientIds.includes(client)));
        } catch (error) {
            fs.writeFileSync(this.clientsPath, '', 'utf-8');
            return [];
        }
        return this.clientIds;
    }

    public async connect_client(clientId: string, mainNumber?: string) {
        if (this.mainNumber == '' && mainNumber != undefined) {
            this.mainNumber = mainNumber;
            this.sessionManager.setManagerNumber(mainNumber);
        }
        if (this.clientIds.includes(clientId)) {
            if (this.clientManager.clients[clientId]?.connected) {
                return;
            }
        } else {
            fs.appendFileSync(this.clientsPath, `${clientId}\n`);
            this.clientIds.push(clientId);
            this.mainWindow.webContents.send('fetch-client-list', clientId);
            this.sessionManager.addClient(clientId);
        }
        await this.sessionManager.createSession("Listening", [clientId], [], this.mainNumber, clientId);
    }

    public async startSession(clientdIds: string[], rate: number, numbers: string[], messageBody: string) {
        await this.sessionManager.createSession("Messages", clientdIds, numbers, [messageBody], rate);
    }

    public async stopSession(sessionId: string) {
        await this.sessionManager.stopSession(sessionId);
    }

    public async pauseSession(sessionId: string) {
        await this.sessionManager.pauseSession(sessionId);
    }

    public async resumeSession(sessionId: string) {
        await this.sessionManager.resumeSession(sessionId);
    }

    public removeWhitelisted(numbers: string[]) {
        const whitelistedNumbers = this.getWhitelisted();
        const updatedNumbers = whitelistedNumbers.filter(number => !numbers.includes(number));
        fs.writeFileSync(this.whitelistPath, updatedNumbers.join('\n'), 'utf-8');
        this.removeWhitelistDuplicates();
    }

    public whitelistNumbers(numbers: string[]) {
        const numbersString = numbers.join('\n');
        fs.appendFileSync(this.whitelistPath, numbersString, 'utf-8');
        this.removeWhitelistDuplicates();
    }

    private removeWhitelistDuplicates() {
        const numbers = this.getWhitelisted();
        const uniqueNumbers = [...new Set(numbers)];
        fs.writeFileSync(this.whitelistPath, uniqueNumbers.join('\n'), 'utf-8');
    }

    public getWhitelisted() {
        try {
            fs.mkdirSync(path.dirname(this.whitelistPath), { recursive: true });
            const numbers = fs.readFileSync(this.whitelistPath, 'utf-8').split('\n').map(number => number.trim());
            return numbers;
        } catch (error) {
            fs.writeFileSync(this.whitelistPath, '', 'utf-8');
            return [];
        }
    }

    public async remove_client(clientId: string) {
        if (!this.clientIds.includes(clientId)) {
            return;
        }
        this.clientIds = this.clientIds.filter(client => client !== clientId);
        fs.readFile(this.clientsPath, 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading clients from file:', err);
                return;
            }
            const updatedClients = data.replace(`${clientId}\n`, '');
            fs.writeFile(this.clientsPath, updatedClients, 'utf-8', (err) => {
                if (err) {
                    console.error('Error removing client from file:', err);
                    return;
                }
                console.log('Client removed successfully');
            });
        });
        await this.clientManager.removeClient(clientId);
        this.mainWindow.webContents.send('fetch-client-list');
    }
}
