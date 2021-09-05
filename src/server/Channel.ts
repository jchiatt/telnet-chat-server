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
    client.writeLine(`Successfully joined ${this._name}.`);

    // notify channel members that member was added
    this.broadcastAsSystem(`${client.auth.username} joined #${this.name}.`);
  }

  broadcast(input: string) {
    const currentTime = new Date().toLocaleTimeString();

    // broadcast message to all connected clients whose active channel is sender's active channel
    Object.entries(this.members).forEach(([username, client]) => {
      client.writeLine(`[${currentTime}] #${this.name} <${username}> ${input}`);
    });

    return true;
  }

  broadcastAsSystem(input: string) {
    const currentTime = new Date().toLocaleTimeString();

    // broadcast message to all connected clients with this channel as their active channel
    Object.entries(this.members).forEach(([username, client]) => {
      client.writeLine(`[${currentTime}] ***System: ${input}`);
    });

    return true;
  }

  kick(client: Client, requester: Client) {
    if (requester.auth.username === this.admin.auth.username) {
      delete this.members[client.auth.username!];
      requester.writeLine(`Kicked ${client.auth.username} from ${this._name}.`);
      delete client.channels[this._name];

      // if channel they were kicked from was their active channel, unset their active channel
      client.removeActiveChannel();

      client.writeLine(`You were kicked from ${this._name}.`);
    } else {
      requester.writeLine(`You aren't the admin of ${this._name}.`);
    }
  }

  removeMember(client: Client) {
    delete this.members[client.auth.username!];
    client.writeLine(`Left ${this._name}.`);
  }
}
