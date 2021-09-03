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

  broadcast(input: string) {
    Object.entries(this.chatServer.clients).forEach(([username, client]) => {
      // broadcast message to all connected clients
      if (client !== this) {
        client.writeLine(`${new Date().toLocaleString()} > ${username} -- ${input}`);
      } else {
        // change output format to indicate that *you* sent this message
        client.writeLine(`${new Date().toLocaleString()} > You (${username}) -- ${input}`);
      }
    });
  }

  greet() {
    this.writeLine(`Welcome ${this.auth.username}. ${this.chatServer.clientCount} users are here.`);
  }

  handleCommand(input: string) {
    // first character is '/'
    const [command, ...params] = input.slice(1).split(" ");

    switch (command) {
      case "CHANNELS": {
        // /CHANNELS - List available channels.
        return;
      }
      case "JOIN": {
        // /JOIN CHANNEL <channel name> - Join a channel, create if it doesn't exist.
        return;
      }
      case "KICK": {
        // /KICK <channel name> <username> - Kick a user from a channel you're an admin of.
        return;
      }
      case "LEAVE": {
        // /LEAVE CHANNEL <channel name> - Leave a channel.
        return;
      }
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
      case "MEMBER": {
        // /MEMBER - List channels you've joined.
        return;
      }
      case "NICK": {
        // /NICK <new username> - Change your username.
        return;
      }
      case "HELP": {
        // /HELP - List available commands.
        this.listCommands();
        return;
      }
      case "HERE": {
        // /HERE <channel name> - List users in this channel. List global users if no channel provided.
        return;
      }
      case "UPDATE": {
        // /UPDATE CHANNEL <channel name> - Update channel name for a channel you're an admin of.
        return;
      }
      case "WHISPER": {
        // /WHISPER <username> - Send a private message.
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

    this.broadcast(input);
  }

  listCommands() {
    this.writeLine(`
      #####################################################################################################
      # COMMANDS
      #
      # /CHANNELS - List available channels.
      # /JOIN CHANNEL <channel name> - Join a channel, create if it doesn't exist.
      # /KICK <channel name> <username> - Kick a user from a channel you're an admin of.
      # /LEAVE CHANNEL <channel name> - Leave a channel.
      # /LOGIN <desired username> - Authenticate with the server.
      # /LOGOUT - Log out.
      # /MEMBER - List channels you've joined.
      # /NICK <new username> - Change your username.
      # /HELP - List available commands.
      # /HERE <channel name> - List users in this channel. List global users if no channel provided.
      # /UPDATE CHANNEL <channel name> - Update channel name for a channel you're an admin of.
      # /WHISPER <username> - Send a private message.
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
