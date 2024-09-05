import { ListeningSession } from "./ListeningSession";
import { MessagesSession } from "./MessagesSession";
import { ClientsManager } from "../ClientsManager";
import { Session } from "./Session";
import { start } from "repl";

export class SessionManager
{
    protected managerNumber: string;
    protected clientManager: ClientsManager;
    protected clientsIds: string[] = [];
    protected sessions: Session[] = [];
    protected sessionTypes: {[type: string]: any} = {
        "Listening": ListeningSession,
        "Messages": MessagesSession,
    };
    
    constructor(cm: ClientsManager, managerNumber: string, clientIds: string[] = [])
    {
        this.clientManager = cm;
        this.managerNumber = managerNumber;
    }

    public getStatus() {

    }

    public setManagerNumber(managerNumber: string) {
        this.managerNumber = managerNumber;
    }

    public addClient(clientId: string) {
        this.clientsIds.push(clientId);
    }

    public async logUser(message: string) {
        //await this.clientManager.clients[this.clientsIds[0]].sendMessage(this.managerNumber, message);
        //ClientsManager.logManager.info(`Sent log message to ${this.managerNumber}: ${message}`);
    }

    public async sessionUpdated() {
        await this.clientManager.sessionUpdated();
    }

    public getSessions() {
        const sessionDictionary: { [sessionId: string]: any } = {};
        for (const session of this.sessions) {
            let sentMessages = 0;
            if (session.sessionType == "Messages") {
                sentMessages = (session as MessagesSession).getSentMessage().length;
            }
            sessionDictionary[session.getId()] = {
                id: session.getId(),
                type: session.getType(),
                clients: session.getClientIds(),
                startTime: session.getStartTime(),
                sentMessage: sentMessages,
                toSendMessage: session.getToSendMessageLength(),
                status: session.getStatus(),
                pausedTime: session.pausedTime(),
            };
        }
        return sessionDictionary;
    }

    public getSession(sessionId: string) {
        return this.sessions.find(session => session.getId().toLocaleLowerCase() === sessionId.toLocaleLowerCase());
    }

    public pauseSession(sessionId: string) {
        let session = this.getSession(sessionId);
        if (session) {
            session.pause();
        }
    }

    public resumeSession(sessionId: string) {
        let session = this.getSession(sessionId);
        if (session) {
            session.resume();
        }
    }

    public stopSession(sessionId: string) {
        let session = this.getSession(sessionId);
        if (session) {
            session.stop();
        }
    }

    public getSessionById(sessionId: string) {
        return this.sessions.find(session => session.getId().toLocaleLowerCase() === sessionId.toLocaleLowerCase());
    }

    protected getSessionsByType(type: string) {
        let ret = [];
        for (let session of this.sessions) { 
            if (session.sessionType == type) {
                ret.push(session);
            }
        }
        return ret;
    }

    public async informUser() {

    }

    public async createSession(sessionType: string, clientIds: string[], participants: string[] = [], ...args: any[])
    {
        this.clientsIds.push(...clientIds);
        if (!this.sessionTypes[sessionType]) { ClientsManager.logManager.error(`Session type ${sessionType} not found`); return; };
        let session;
        switch(sessionType) {
            case "Listening":
                // cm: ClientsManager, sm: SessionManager, clientIds: string[], mainNumber?: string, mainClient?: string
                if (args.length < 1) { ClientsManager.logManager.error(`Missing main number`); return; }
                if (args.length < 2) { ClientsManager.logManager.error(`Missing main client`); return; }
                session = new ListeningSession(this.clientManager, this, clientIds, args[0], args[1]);
                break;
            case "Messages":
                // cm: ClientsManager, sm: SessionManager, clientIds: string[], phoneNumbers: string[], messageBody: string[], sleepTime?: number, every?: number, wait?: number
                if (args.length < 1) { ClientsManager.logManager.error(`Missing phone numbers`); return; }
                if (participants.length < 1) { ClientsManager.logManager.error(`Missing participants`); return; }
                session = new MessagesSession(this.clientManager, this, clientIds, participants, args[0], args[1], args[2], args[3])
                break;
            default:
                return;
        }

        this.sessions.push(session);
        await session.init();
        await session.startSession();
        return session;
    }
}