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

  send() {
    this.recipient.send(`${this.createdAt} ${this.content}`);
  }
}
