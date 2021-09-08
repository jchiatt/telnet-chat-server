import { Message } from "../message/Message";
import { Response } from "../message/Response";
import { ChatServer } from "../server/ChatServer";
import { Client } from "./Client";

export class Auth {
  private _authenticated: boolean;
  private _chatServer: ChatServer;
  private _client: Client;
  private _username: string | null;

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
    let messages = [];

    if (this.authenticated) {
      const message = new Message(
        this._chatServer,
        this._client,
        "You are already authenticated. Type /LOGOUT to log out.",
      );
      messages.push(message);
      return new Response(true, messages);
    }

    if (!username) {
      const message = new Message(
        this._chatServer,
        this._client,
        "You must supply a username. Type /HELP for help.",
      );
      messages.push(message);
      return new Response(true, messages);
    }

    if (this._chatServer.clients[username]) {
      const message = new Message(
        this._chatServer,
        this._client,
        "Username already taken. Please try another.",
      );
      messages.push(message);
      return new Response(true, messages);
    }

    // mark as authenticated and set the username
    this._authenticated = true;
    this._username = username;

    // register client with chat server
    this._chatServer.registerClient(this._client);

    // set client's default nickname to username
    this._client.updateNickname(username);

    // Hello there!
    messages.push(this._client.greet());

    return new Response(true, messages);
  }

  logout() {
    let messages = [];

    if (!this.authenticated) {
      const message = new Message(
        this._chatServer,
        this._client,
        `You aren't currently logged in. Did you mean "/LOGIN"?`,
      );
      messages.push(message);
    }

    // deregister client with chat server
    this._chatServer.deleteClient(this._client);

    // unauthenticate
    this._authenticated = false;
    this._username = null;

    const message = new Message(this._chatServer, this._client, "You are now logged out.");
    messages.push(message);

    return new Response(true, messages);
  }
}
