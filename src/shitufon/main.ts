import { markAsUntransferable } from 'worker_threads';
import { BrowserWindow } from 'electron';
import { extractPhoneNumbers } from './Excel'
import { ClientsManager } from './ClientsManager';
import { SessionManager } from './sessions/SessionManager';
import fs from 'fs';

export class Main {
    public numbers: string[] = [];
    private clientIds: string[];
    private clientManager: ClientsManager;
    private sessionManager: SessionManager;
    private mainWindow: BrowserWindow;
    private mainNumber = '';
    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.clientIds = [];
        this.clientManager = new ClientsManager(this.mainWindow);
        this.mainWindow.webContents.send('fetch-client-list');
        this.sessionManager = new SessionManager(this.clientManager, this.mainNumber, []);
    }
    
    public async init() {
        // Start all the clients
        this.get_clients();
        for (let clientId of this.clientIds) {
            await this.connect_client(clientId);
        }
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
        const number = extractPhoneNumbers(file, [], []);
        this.numbers.push(...number);
    }

    public get_clients() {
        try {
            const clients = fs.readFileSync('src/clients.txt', 'utf-8').split('\n').map(client => client.trim());;
            this.clientIds.push(...clients.filter(client => client.trim() !== '' && !this.clientIds.includes(client)));
        } catch (error) {
            console.error('Error reading clients from file:', error);
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
            fs.appendFileSync('src/clients.txt', `${clientId}\n`);
            this.clientIds.push(clientId);
            this.mainWindow.webContents.send('fetch-client-list', clientId);
            this.sessionManager.addClient(clientId);
        }
        await this.sessionManager.createSession("Listening", [clientId], [], this.mainNumber, clientId);
    }

    public async startSession(clientdIds: string[], rate: number, numbers: string[] ,mainNumber: string, messageBody: string) {
        await this.sessionManager.createSession("Messages", clientdIds, numbers, mainNumber, [messageBody]);
    }

    public async remove_client(clientId: string) {
        if (!this.clientIds.includes(clientId)) {
            return;
        }
        this.clientIds = this.clientIds.filter(client => client !== clientId);
        this.mainWindow.webContents.send('fetch-client-list', clientId);
        fs.readFile('src/clients.txt', 'utf-8', (err, data) => {
            if (err) {
                console.error('Error reading clients from file:', err);
                return;
            }
            const updatedClients = data.replace(`${clientId}\n`, '');
            fs.writeFile('src/clients.txt', updatedClients, 'utf-8', (err) => {
                if (err) {
                    console.error('Error removing client from file:', err);
                    return;
                }
                console.log('Client removed successfully');
            });
        });
        await this.clientManager.removeClient(clientId);
    }
}
