import { Client } from "../types";

export class Channel {
  _name: string;
  _admin: Client;
  _members: Record<string, Client>;

  constructor(name: string, admin: Client) {
    this._name = name;
    this._admin = admin;

    if (!admin._auth || !admin._auth._authenticated) {
      throw new Error("Not authenticated.");
    }

    this._members = {};
    this.addMember(admin);

    this._admin._chatServer._channels[name] = this;
  }

  get admin() {
    return this._admin;
  }

  get members() {
    return this._members;
  }

  get name() {
    return this._name;
  }

  broadcast(sender: Client, input: string) {
    Object.entries(this.members).forEach(([username, client]) => {
      // broadcast message to all connected clients in this channel
      if (client !== sender) {
        client.writeLine(`${new Date().toLocaleString()} > ${sender._auth.username} -- ${input}`);
      } else {
        // change output format to indicate that *you* sent this message
        client.writeLine(
          `${new Date().toLocaleString()} > You (${sender._auth.username}) -- ${input}`,
        );
      }
    });
  }

  addMember(client: Client) {
    this._members[client._auth.username!] = client;
    client.writeLine(`Successfully joined ${this.name}.`);
  }

  kick(client: Client, requester: Client) {
    if (requester._auth.username === this.admin._auth.username) {
      delete this._members[client._auth.username!];
      requester.writeLine(`Kicked ${client._auth.username} from ${this.name}.`);
      client.writeLine(`You were kicked from ${this.name}.`);
    } else {
      requester.writeLine(`You aren't the admin of ${this.name}.`);
    }
  }

  removeMember(client: Client) {
    delete this._members[client._auth.username!];
    client.writeLine(`Left ${this.name}.`);
  }
}
