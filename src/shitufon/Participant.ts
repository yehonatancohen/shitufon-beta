import { Client, GroupChat, Message, GroupParticipant } from 'whatsapp-web.js';

export class Participant {
    private id = "";
    private isAdmin = false;
    private number: string = "";
    private name: string = "";
    private gender: string = "";
    private participantObj: GroupParticipant | string = "";
    private sentMessages: Message[] = [];

    constructor(id : string) {
        this.id = id;
    }

    public async initialize(participantObj: GroupParticipant) {
        this.participantObj = participantObj;
        this.isAdmin = participantObj.isAdmin;
    }

    public getId() {
        return this.id;
    }

}
