import net, { Server, Socket } from "net";
import { Client } from "../client/Client";
import { Response } from "../message/Response";
import { Channels, Clients } from "../types";

export class ChatServer {
  private _channels: Channels;
  private _clients: Clients;
  private _clientCount: number;
  private _server: Server;

  constructor() {
    this._channels = {};
    this._clients = {};
    this._clientCount = 0;

    const server = net.createServer();
    this._server = server;
  }

  get channels() {
    return this._channels;
  }

  get clientCount() {
    return Object.keys(this._clients).length;
  }

  get clients() {
    return this._clients;
  }

  addEventListener(event: string, callback: (socket: Socket) => void) {
    this._server.on(event, callback);
  }

  createClient(socket: Socket) {
    const client = new Client(socket, this);
    client.writeLine("Welcome to Party Chat. We hope you enjoy your stay.");
    client.listCommands();

    return client;
  }

  handleResponse(response: Response) {
    if (response.success) {
      response.messages.forEach((message) => {
        message.send();
      });
    } else {
      // log failed responses
    }
  }

  listen(port?: number) {
    this._server.listen(port || 8023);
  }

  onConnection(callback: (socket: Socket) => void) {
    this.addEventListener("connection", callback);
  }

  onClose(callback: (socket: Socket) => void) {
    this.addEventListener("close", callback);
  }

  onError(callback: (socket: Socket) => void) {
    this.addEventListener("error", callback);
  }

  registerClient(client: Client) {
    if (client.auth.username) {
      this.clients[client.auth.username] = client;
    }
  }

  deleteClient(client: Client) {
    if (client.auth.username && this.clients[client.auth.username]) {
      delete this.clients[client.auth.username];
    }

    return client;
  }
}
