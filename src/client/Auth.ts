import { ChatServer } from "../server/ChatServer";
import { Client } from "./Client";

export class Auth {
  _authenticated: boolean;
  _chatServer: ChatServer;
  _client: Client;
  _username: string | null;

  constructor(client: Client, chatServer: ChatServer) {
    this._authenticated = false;
    this._chatServer = chatServer;
    this._client = client;
    this._username = null;
  }

  get authenticated() {
    return this._authenticated;
  }

  get username() {
    return this._username;
  }

  login(username: string) {
    if (this._authenticated) {
      this._client.writeLine("You are already authenticated. Type /LOGOUT to log out.");
      return;
    }

    if (!username) {
      this._client.writeLine("You must supply a username. Type /HELP for help.");
      return;
    }

    if (this._chatServer.clients[username]) {
      this._client.writeLine("Username already taken. Please try another.");
      return;
    } else {
      // mark as authenticated and set the username
      this._authenticated = true;
      this._username = username;

      // register client with chat server
      this._chatServer.registerClient(this._client);

      // Hello there!
      this._client.greet();
    }
  }

  logout() {
    if (!this._authenticated) {
      this._client.writeLine('You aren\'t currently logged in. Did you mean "/LOGIN"?');
      return;
    }

    this._chatServer.deleteClient(this._client);

    this._authenticated = false;
    this._username = null;

    this._client.writeLine("You are now logged out.");
  }
}
