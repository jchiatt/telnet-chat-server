import { Channel, ChatServer, Client } from "../types";

export class Message {
  private _content: string;
  private _createdAt: string;
  private _recipient: Client | Channel;
  private _sender: Client | ChatServer | Channel | null;

  constructor(
    sender: Client | ChatServer | Channel | null,
    recipient: Client | Channel,
    content: string,
  ) {
    this._content = content;
    this._createdAt = new Date().toLocaleTimeString();
    this._recipient = recipient;
    this._sender = sender;
  }

  get createdAt() {
    return this._createdAt;
  }

  get content() {
    return this._content;
  }

  get recipient() {
    return this._recipient;
  }

  get sender() {
    return this._sender;
  }

  log(message: string) {
    let senderName: string | null = null;

    // log to app.log via stdout monkeypatch
    const senderType = this.sender && this.sender.constructor.name;

    switch (senderType) {
      case "Channel": {
        // @ts-ignore
        senderName = `#${this.sender.name}`;
        break;
      }
      case "ChatServer": {
        senderName = "ChatServer";
        break;
      }
      case "Client": {
        // @ts-ignore
        senderName = this.sender.nickname;
        break;
      }
      default: {
        senderName = "ChatServer";
      }
    }

    // @ts-ignore
    console.log(`[${senderName}->${this.recipient.name || this.recipient.nickname}] ${message}`);
  }

  send() {
    const message = `${this.createdAt} ${this.content}`;

    // send message to client
    this.recipient.send(message);

    // log the message
    this.log(message);
  }
}
