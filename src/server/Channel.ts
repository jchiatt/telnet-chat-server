import { Message } from "../message/Message";
import { Response } from "../message/Response";
import { Client } from "../types";

export class Channel {
  private _name: string;
  private _admin: Client;
  private _members: Record<string, Client>;

  constructor(name: string, admin: Client) {
    this._name = name;
    this._admin = admin;

    if (!admin.auth || !admin.auth.authenticated) {
      throw new Error("Not authenticated.");
    }

    this._members = {};
    this.addMember(admin);

    this._admin.chatServer.channels[name] = this;
  }

  get admin() {
    return this._admin;
  }

  get memberCount() {
    return Object.keys(this._members).length;
  }

  get members() {
    return this._members;
  }

  get name() {
    return this._name;
  }

  addMember(client: Client) {
    this.members[client.auth.username!] = client;

    const messages = [];

    const clientMessage = new Message(this, client, `Successfully joined ${this._name}.`);
    const systemMessage = this.broadcastAsSystem(`${client.nickname} joined #${this.name}.`);

    messages.push(clientMessage);
    messages.concat(systemMessage);

    // notify channel members that member was added
    return messages;
  }

  broadcast(input: string, sender?: Client) {
    const currentTime = new Date().toLocaleTimeString();
    const messages: Message[] = [];

    // broadcast message to all connected clients whose active channel is this channel
    Object.values(this.members).forEach((client) => {
      const senderNickname = sender ? sender.nickname : null;
      const formattedSenderNickname = senderNickname ? `<${senderNickname}>` : "";
      const message = new Message(
        this,
        client,
        `#${this.name} ${formattedSenderNickname} ${input}`,
      );
      messages.push(message);
    });

    return new Response(true, messages);
  }

  broadcastAsSystem(input: string) {
    const currentTime = new Date().toLocaleTimeString();
    const messages: Message[] = [];

    // broadcast message to all connected clients with this channel as their active channel
    Object.values(this.members).forEach((client) => {
      const message = new Message(null, this, `***System: ${input}`);
      messages.push(message);
    });

    return messages;
  }

  kick(client: Client, requester: Client) {
    const messages = [];
    if (requester.auth.username === this.admin.auth.username) {
      delete this.members[client.auth.username!];
      messages.push(
        new Message(this, requester, `Kicked ${client.auth.username} from ${this._name}.`),
      );
      delete client.channels[this._name];

      // if channel they were kicked from was their active channel, unset their active channel
      client.removeActiveChannel();

      messages.push(new Message(this, client, `You were kicked from ${this._name}.`));
    } else {
      messages.push(new Message(this, requester, `You aren't the admin of ${this._name}.`));
    }

    return new Response(true, messages);
  }

  removeMember(client: Client) {
    delete this.members[client.auth.username!];
    const message = new Message(this, client, `Left ${this._name}.`);
    return message;
  }

  send(message: string) {
    return this.broadcast(message);
  }
}
