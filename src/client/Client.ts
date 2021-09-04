import { Socket } from "net";
import { ChatServer } from "../server/ChatServer";
import { Auth } from "./Auth";
import { appendNewLine } from "../helpers/appendNewLine";
import { Channel } from "../server/Channel";

export class Client implements Client {
  _auth: Auth;
  _chatServer: ChatServer;
  _channels: Record<string, Channel>;
  _ip: string | null;
  _socket: Socket;

  constructor(socket: Socket, chatServer: ChatServer) {
    this._auth = new Auth(this, chatServer);
    this._channels = {};
    this._chatServer = chatServer;
    this._ip = socket.remoteAddress || null;
    this._socket = socket;
  }

  broadcast(input: string) {
    Object.entries(this._chatServer.clients).forEach(([username, client]) => {
      // broadcast message to all connected clients
      if (client !== this) {
        client.writeLine(`${new Date().toLocaleString()} > ${username} -- ${input}`);
      } else {
        // change output format to indicate that *you* sent this message
        client.writeLine(`${new Date().toLocaleString()} > You (${username}) -- ${input}`);
      }
    });
  }

  joinChannel(name: string) {
    // does this channel exist?
    if (this._chatServer._channels[name]) {
      return;
    }

    // channel doesn't exist, create it
    const channel = new Channel(name, this);
    this._channels[name] = channel;
  }

  greet() {
    this.writeLine(
      `Welcome ${this._auth.username}. ${this._chatServer.clientCount} users are here.`,
    );
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
        // /JOIN <channel name> - Join a channel, create if it doesn't exist.
        // this._chatServer
        this.joinChannel(params.join(" "));
        return;
      }
      case "JOINED": {
        this.showChannels();
        return;
      }
      case "KICK": {
        // /KICK <channel name> <username> - Kick a user from a channel you're an admin of.
        return;
      }
      case "LEAVE": {
        // /LEAVE <channel name> - Leave a channel.
        return;
      }
      case "LOGIN": {
        // /LOGIN <desired username> - Authenticate with the server.
        this._auth.login(params.join(" "));
        return;
      }
      case "LOGOUT": {
        // /LOGOUT - Log out.
        this._auth.logout();
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

    if (!this._auth.authenticated) {
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
      # /CHANNELS - List all available channels.
      # /JOIN <channel name> - Join a channel, create if it doesn't exist.
      # /JOINED - List channels you've joined.
      # /KICK <channel name> <username> - Kick a user from a channel you're an admin of.
      # /LEAVE <channel name> - Leave a channel.
      # /LOGIN <desired username> - Authenticate with the server.
      # /LOGOUT - Log out.
      # /MEMBER - List channels you've joined.
      # /NICK <new username> - Change your username.
      # /HELP - List available commands.
      # /HERE <channel name> - List users in this channel. List global users if no channel provided.
      # /WHISPER <username> - Send a private message.
      #####################################################################################################
    `);
  }

  showChannels() {
    this.writeLine(`Your channels:`);
    Object.keys(this._channels).forEach((name) => {
      this.writeLine(`# ${name}`);
    });
  }

  write(msg: string) {
    this._socket.write(msg);
  }

  writeLine(msg: string) {
    this.write(appendNewLine(msg));
  }
}
