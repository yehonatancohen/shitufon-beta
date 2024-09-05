import { start } from 'repl';
import { ClientController } from '../ClientController';
import { ClientsManager } from '../ClientsManager';
import { SessionManager } from './SessionManager';

export enum SessionStatus {
    STARTED,
    STOPPED,
    PAUSED,
    RESUMED,
    DONE
}

export class Session {
    protected sessionId: string;
    protected cm: ClientsManager;
    protected clients: { [clientId: string]: ClientController };
    protected clientIds: string[];
    protected status: SessionStatus;
    public sessionType: string;
    protected startTime: number;
    protected timePaused: number;
    protected sessionManager: SessionManager; 

    constructor(cm: ClientsManager, sm: SessionManager) {
        this.cm = cm;
        this.startTime = new Date().getTime();
        this.timePaused = this.startTime;
        this.sessionManager = sm;
        this.sessionType = "General";
        this.sessionId = this.generateId();
        this.clients = {};
        this.clientIds = [];
        this.generateId()
        this.status = SessionStatus.STOPPED;
    }

    public getStartTime() {
        return this.startTime;
    }

    public getStatus() {
        if (this.status == SessionStatus.STARTED || this.status == SessionStatus.RESUMED)
            return "Running";
        else if (this.status == SessionStatus.STOPPED)
            return "Stopped";
        else if (this.status == SessionStatus.PAUSED)
            return "Paused";
        else if (this.status == SessionStatus.DONE)
            return "Done";
    }

    public getClients() {
        return this.clients;
    }

    public getId(){
        return this.sessionId;
    }

    public getType(){
        return this.sessionType;
    }

    protected generateId()
    {
        if (this.sessionId)
        {
            const err = new Error("Session id already exits");
            this.handleError(err);
            return this.sessionId;
        }
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        const length = 8;
        for (let i = 0; i < length; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return id;
    }

    public async sessionUpdated() {
        await this.sessionManager.sessionUpdated();
    }

    public getToSendMessageLength() {
        return 0;
    }

    public async startSession()
    {
        // start session
        this.status = SessionStatus.STARTED;
        this.sessionUpdated();
        ClientsManager.logManager.info(`Starting session ${this.sessionId} of type ${this.sessionType}`);
    }

    public getClientIds()
    {
        return this.clientIds;
    }

    public pausedTime() 
    {
        return this.timePaused;
    }

    public async stop()
    {
        // stop session
        this.status = SessionStatus.STOPPED;
    }

    public async pause()
    {
        // pause session
        this.timePaused = new Date().getTime();
        this.status = SessionStatus.PAUSED;
    }

    public async resume()
    {
        // resume session
        this.status = SessionStatus.RESUMED;
    }

    protected handleError(error: Error)
    {
        switch (error.message)
        {
            case "Session id already exits":
                ;
                break;
        }
    }

    protected async connectClients(clientIds: string[])
    {
        let clients = await this.cm.connectClients(clientIds);
        return clients;
    }

    protected async initClients(clientIds: string[])
    {
        let dissconnectedClients: string[] = [];
        for (let clientId of clientIds)
        {
            if (!this.cm.clients[clientId] || this.cm.clients[clientId].connected == false)
                dissconnectedClients.push(clientId);
        }
        let clients = await this.connectClients(clientIds.filter(clientId => dissconnectedClients.includes(clientId)));
        for (let client of clients) {
            this.clients[client.getClientId()] = client;
        }
    }

    protected getClientsLength()
    {
        return Object.keys(this.clients).length;
    }

    protected loadSession()
    {
        // load session
    }

    protected saveSession()
    {
        // save session
    }
}