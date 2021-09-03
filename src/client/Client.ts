import { Socket } from "net";
import { ChatServer } from "../server/ChatServer";
import { Auth } from "./Auth";
import { appendNewLine } from "../helpers/appendNewLine";

export class Client implements Client {
  auth: Auth;
  chatServer: ChatServer;
  ip: string | null;
  socket: Socket;

  constructor(socket: Socket, chatServer: ChatServer) {
    this.auth = new Auth(this, chatServer);
    this.chatServer = chatServer;
    this.ip = socket.remoteAddress || null;
    this.socket = socket;
  }

  greet() {
    this.writeLine(`Welcome ${this.auth.username}. ${this.chatServer.clientCount} users are here.`);
  }

  handleCommand(input: string) {
    // first character is '/'
    const [command, ...params] = input.slice(1).split(" ");

    switch (command) {
      case "LOGIN": {
        // /LOGIN <desired username> - Authenticate with the server.
        this.auth.login(params.join(" "));
        return;
      }
      case "LOGOUT": {
        // /LOGOUT - Log out.
        this.auth.logout();
        return;
      }
      case "HELP": {
        // /HELP - List available commands.
        this.listCommands();
        return;
      }
      default: {
        // the default could be sending a message, but we're already handling that as a default in this.handleInput
        this.writeLine("Invalid command. Type /HELP for help.");
      }
    }
  }

  handleInput(input: string) {
    if (input.startsWith("/")) {
      this.handleCommand(input);
      return;
    }

    if (!this.auth.authenticated) {
      this.writeLine("You are not authenticated. Type /AUTH to authenticate.");
      return;
    }
  }

  listCommands() {
    this.writeLine(`
      #####################################################################################################
      # COMMANDS
      #
      # /LOGIN <desired username> - Authenticate with the server.
      # /LOGOUT - Log out.
      # /HELP - List available commands.
      #####################################################################################################
    `);
  }

  write(msg: string) {
    this.socket.write(msg);
  }

  writeLine(msg: string) {
    this.write(appendNewLine(msg));
  }
}
