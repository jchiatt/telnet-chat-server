import { Socket } from "net";
import { appendNewLine } from "../helpers/appendNewLine";
import { Auth } from "./Auth";
import { Channel } from "../server/Channel";
import { ChatServer } from "../server/ChatServer";

export class Client {
  private _activeChannel: Channel | null;
  private _auth: Auth;
  private _chatServer: ChatServer;
  private _channels: Record<string, Channel>;
  private _ip: string | null;
  private _nickname: string;
  private _socket: Socket;

  constructor(socket: Socket, chatServer: ChatServer) {
    this._activeChannel = null;
    this._auth = new Auth(this, chatServer);
    this._channels = {};
    this._chatServer = chatServer;
    this._ip = socket.remoteAddress || null;
    this._nickname = this._auth.username!;
    this._socket = socket;
  }

  get activeChannel() {
    return this._activeChannel;
  }

  get auth() {
    const { authenticated, username } = this._auth;
    return {
      authenticated,
      username,
    };
  }

  get channels() {
    return this._channels;
  }

  get chatServer() {
    return this._chatServer;
  }

  get ip() {
    return this._ip;
  }

  broadcast(input: string) {
    if (!this.activeChannel) {
      this.writeLine("You aren't in an active channel. Please join a channel to send a message.");
      return false;
    }

    return this.activeChannel.broadcast(input);
  }

  greet() {
    const { clientCount } = this._chatServer;
    clientCount === 1
      ? this.writeLine(`Welcome ${this._auth.username}. You are alone.`)
      : this.writeLine(
          `Welcome ${this._auth.username}. ${this._chatServer.clientCount} users are here.`,
        );
  }

  handleCommand(input: string) {
    // first character is '/'
    let [command, ...params] = input.slice(1).split(" ");
    command = command.toUpperCase();

    if (!this._auth.authenticated && command !== "LOGIN") {
      this.writeLine("You are not authenticated. Type /AUTH to authenticate.");
      return false;
    }

    switch (command) {
      case "CHANNEL": {
        // /CHANNEL - List your active channel.
        return this.showActiveChannel();
      }
      case "CHANNELS": {
        // /CHANNELS - List available channels.
        return this.showAllChannels();
      }
      case "JOIN": {
        // /JOIN <channel name> - Join a channel, create if it doesn't exist.
        return this.joinChannel(params.join(" "));
      }
      case "KICK": {
        // /KICK <username> <channel name> - Kick a user from a channel you're an admin of.
        if (params.length < 2) {
          this.writeLine("You must provide a channel name.");
          return false;
        }

        const username = params[0];
        const channel = params.slice(1).join(" ");

        return this.kickMember(username, channel);
      }
      case "LEAVE": {
        // /LEAVE <channel name> - Leave a channel.
        return this.leaveChannel(params.join(" "));
      }
      case "LOGIN": {
        // /LOGIN <desired username> - Authenticate with the server.
        if (params.length > 1) {
          this.writeLine("Spaces aren't allowed in usernames. Type /HELP for help.");
          return false;
        }
        return this._auth.login(params[0]);
      }
      case "LOGOUT": {
        // /LOGOUT - Log out.
        return this._auth.logout();
      }
      case "MEMBER": {
        // /MEMBER - List channels you've joined.
        return this.showUserChannels();
      }
      case "NICK": {
        // /NICK <new username> - Change your username.
        return;
      }
      case "HELP": {
        // /HELP - List available commands.
        return this.listCommands();
      }
      case "HERE": {
        // /HERE <channel name> - List users in your active channel. List global users if no channel provided.
        return this.showActiveChannelActiveMembers();
      }
      case "SWITCH": {
        // /SWITCH <channel name> - Switch to a channel you're a member of.
        if (!params.length) {
          this.writeLine("You must provide a channel name.");
          return false;
        }
        return this.switchActiveChannel(params.join(" "));
      }
      case "WHISPER": {
        // /WHISPER <username> <message> - Send a private message.
        if (params.length < 2) {
          this.writeLine("You must specify a username and a message.");
          return false;
        }

        const user = params[0];
        const message = params.slice(1).join(" ");

        return this.whisper(user, message);
      }
      default: {
        // the default could be sending a message, but we're already handling that as a default in this.handleInput
        this.writeLine("Invalid command. Type /HELP for help.");
      }
    }
  }

  handleInput(input: string) {
    if (input.startsWith("/")) {
      return this.handleCommand(input);
    }

    if (!this._auth.authenticated) {
      this.writeLine("You are not authenticated. Type /AUTH to authenticate.");
      return false;
    }

    return this.broadcast(input);
  }

  joinChannel(name: string) {
    if (!name) {
      this.writeLine("You must supply a channel name. Type /HELP for help.");
      return false;
    }

    // does this channel exist?
    if (this._chatServer.channels[name]) {
      this._chatServer.channels[name].addMember(this);
      this._channels[name] = this._chatServer.channels[name];
      this.switchActiveChannel(name);
      this.writeLine(`Joined ${name}. There are ${this._channels[name].memberCount} users here.`);
      return true;
    }

    // channel doesn't exist, create it
    const channel = new Channel(name, this);
    this._channels[name] = channel;
    this.switchActiveChannel(name);
    return true;
  }

  kickMember(username: string, channel: string) {
    // does this channel exist
    if (!this._chatServer.channels[channel]) {
      this.writeLine(`Channel ${channel} doesn't exist.`);
      return false;
    }

    // is this client a channel admin?
    if (this._chatServer.channels[channel].admin._auth.username !== this._auth.username) {
      this.writeLine(`You aren't an admin of ${channel}.`);
      return false;
    }

    // Does this client exist?
    const client = this._chatServer.clients[username];
    if (!client) {
      this.writeLine(`${username} isn't a member of the server.`);
      return false;
    }

    // Is this client a member of the channel you want to kick them from?
    if (!client.channels[channel]) {
      this.writeLine(`${username} isn't a member of ${channel}.`);
      return false;
    }

    // Disable with extreme prejudice
    this._chatServer.channels[channel].kick(client, this);

    return true;
  }

  leaveChannel(name: string) {
    if (!name) {
      this.writeLine("You must supply a channel name. Type /HELP for help.");
      return false;
    }

    // if the channel doesn't exist, bail
    if (!this._chatServer.channels[name]) {
      this.writeLine(`Channel ${name} doesn't exist. Type /HELP for help.`);
      return false;
    }

    // channel exists, leave it
    const channel = this._chatServer.channels[name];
    channel.removeMember(this);
    delete this._channels[name];

    // if left channel was active channel, unset active channel
    if (this.activeChannel && name === this.activeChannel.name) {
      this._activeChannel = null;
    }

    return true;
  }

  listCommands() {
    this.writeLine(`
      #####################################################################################################
      # COMMANDS
      #
      # /CHANNEL - List your active channel.
      # /CHANNELS - List all available channels.
      # /JOIN <channel name> - Join a channel, create if it doesn't exist.
      # /KICK <channel name> <username> - Kick a user from a channel you're an admin of.
      # /LEAVE <channel name> - Leave a channel.
      # /LOGIN <desired username> - Authenticate with the server.
      # /LOGOUT - Log out.
      # /MEMBER - List channels you've joined.
      # /NICK <new display name> - Change your display name.
      # /HELP - List available commands.
      # /HERE <channel name> - List users in this channel. List global users if no channel provided.
      # /SWITCH <channel name> - Switch to a channel you're a member of.
      # /USERNAME <new username> - Change your username.
      # /WHISPER <username> <message> - Send a private message.
      #####################################################################################################
    `);

    return true;
  }

  removeActiveChannel() {
    this._activeChannel = null;
    return true;
  }

  showActiveChannel() {
    if (!this.activeChannel) {
      this.writeLine(`You have no active channel.`);
      return true;
    }

    this.writeLine(`${this.activeChannel.name} is your active channel.`);
    return true;
  }

  showActiveChannelActiveMembers() {
    if (!this.activeChannel) {
      this.writeLine(`You have no active channel.`);
      return true;
    }

    this.writeLine(`Members here:`);
    Object.keys(this.activeChannel.members).forEach((username) => {
      this.writeLine(username);
    });

    return true;
  }

  showAllChannels() {
    const channels = Object.keys(this._chatServer.channels);
    if (!channels.length) {
      this.writeLine("There are no public channels on the server. Create one!");
      return false;
    }

    this.writeLine("Global channels:");
    channels.forEach((name) => {
      this.writeLine(`#${name}`);
    });

    return true;
  }

  showUserChannels() {
    const channels = Object.keys(this._channels);
    if (!channels.length) {
      this.writeLine("You haven't joined any channels.");
      return false;
    }

    this.writeLine("Your channels:");
    channels.forEach((name) => {
      this.writeLine(`#${name}${name === this.activeChannel!.name ? "* (active channel)" : ""}`);
    });

    return true;
  }

  switchActiveChannel(name: string) {
    if (!this.chatServer.channels[name]) {
      this.writeLine(`That's not a valid channel.`);
      return false;
    }

    if (!this.channels[name]) {
      this.writeLine(`You aren't a member of ${name}.`);
      return false;
    }

    // no previously active channel
    if (!this.activeChannel) {
      this._activeChannel = this.channels[name];
      return true;
    }

    // desired channel is already active channel
    if (this.activeChannel.name === name) {
      return true;
    }

    // switch the channel
    this._activeChannel = this.channels[name];
    this.writeLine(`Switched active channel to ${name}.`);
    return true;
  }

  whisper(user: string, message: string) {
    const currentTime = new Date().toLocaleTimeString();

    this.chatServer.clients[user].writeLine(
      `[${currentTime}] (whisper) <${this.auth.username}> ${message}`,
    );

    return true;
  }

  write(msg: string) {
    this._socket.write(msg);
    return true;
  }

  writeLine(msg: string) {
    return this.write(appendNewLine(msg));
  }
}
