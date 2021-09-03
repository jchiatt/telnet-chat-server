import net, { Server, Socket } from "net";
import { Client } from "../client/Client";
import { Clients } from "../types";

export class ChatServer {
  _clients: Clients;
  _clientCount: number;
  _server: Server;

  constructor() {
    this._clients = {};
    this._clientCount = 0;

    const server = net.createServer();
    this._server = server;
  }

  get clients() {
    return this._clients;
  }

  get clientCount() {
    return Object.keys(this._clients).length;
  }

  get server() {
    return this._server;
  }

  addEventListener(event: string, callback: (socket: Socket) => void) {
    this.server.on(event, callback);
  }

  createClient(socket: Socket) {
    const client = new Client(socket, this);
    client.writeLine("Welcome to Party Chat. We hope you enjoy your stay.");
    client.listCommands();

    return client;
  }

  listen(port?: number) {
    this.server.listen(port || 8023);
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
      this._clients[client.auth.username] = client;
    }
  }

  deleteClient(client: Client) {
    if (client.auth.username && this._clients[client.auth.username]) {
      delete this._clients[client.auth.username];
    }

    return client;
  }
}
