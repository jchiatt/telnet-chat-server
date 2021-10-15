import { Socket } from "net";
import { appendNewLine } from "../helpers/appendNewLine";
import { Auth } from "./Auth";
import { Channel } from "../server/Channel";
import { ChatServer } from "../server/ChatServer";
import { Message } from "../message/Message";
import { Response } from "../message/Response";

export class Client {
  private _activeChannel: Channel | null;
  private _auth: Auth;
  private _chatServer: ChatServer;
  private _channels: Record<string, Channel>;
  private _ip: string | null;
  private _nickname: string | null;
  private _socket: Socket;

  constructor(socket: Socket, chatServer: ChatServer) {
    this._activeChannel = null;
    this._auth = new Auth(this, chatServer);
    this._channels = {};
    this._chatServer = chatServer;
    this._ip = socket.remoteAddress || null;

    this._nickname = null;
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

  get nickname() {
    return this._nickname;
  }

  broadcast(input: string) {
    if (!this.activeChannel) {
      const message = new Message(
        this.chatServer,
        this,
        "You aren't in an active channel. Please join a channel to send a message.",
      );
      const response = new Response(true, message);
      return response;
    }

    return this.activeChannel.broadcast(input, this);
  }

  greet() {
    const { clientCount } = this._chatServer;

    const message = new Message(
      this._chatServer,
      this,
      clientCount === 1
        ? `Welcome ${this._auth.username}. You are alone.`
        : `Welcome ${this._auth.username}. ${this._chatServer.clientCount} users are here.`,
    );
    return message;
  }

  handleCommand(input: string) {
    // first character is '/'
    let [command, ...params] = input.slice(1).split(" ");
    command = command.toUpperCase();

    if (!this._auth.authenticated && command !== "LOGIN" && command !== "HELP") {
      const message = new Message(
        this._chatServer,
        this,
        "You are not authenticated. Type /LOGIN <username> to authenticate.",
      );
      return new Response(true, message);
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
          const message = new Message(this._chatServer, this, "You must provide a channel name.");

          return new Response(true, message);
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
          const message = new Message(
            this._chatServer,
            this,
            "Spaces aren't allowed in usernames. Type /HELP for help.",
          );
          return new Response(true, message);
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
        // /NICK <new nickname> - Change your nickname.
        if (!params.length) {
          const message = new Message(this._chatServer, this, "You must provide a new nickname.");
          return new Response(true, message);
        }
        return new Response(true, this.updateNickname(params.join(" ")));
      }
      case "HELP": {
        // /HELP - List available commands.
        return this.listCommands();
      }
      case "HERE": {
        // /HERE - List users in your active channel.
        return this.showActiveChannelActiveMembers();
      }
      case "SWITCH": {
        // /SWITCH <channel name> - Switch to a channel you're a member of.
        if (!params.length) {
          const message = new Message(this._chatServer, this, "You must provide a channel name.");
          return new Response(true, message);
        }
        return this.switchActiveChannel(params.join(" "));
      }
      case "WHISPER": {
        // /WHISPER <username> <message> - Send a private message.
        if (params.length < 2) {
          const message = new Message(
            this._chatServer,
            this,
            "You must specify a username and a message.",
          );
          return new Response(true, message);
        }

        const user = params[0];
        const message = params.slice(1).join(" ");

        return this.whisper(user, message);
      }
      default: {
        // the default could be sending a message, but we're already handling that as a default in this.handleInput
        const message = new Message(
          this._chatServer,
          this,
          "Invalid command. Type /HELP for help.",
        );
        return new Response(true, message);
      }
    }
  }

  handleInput(input: string) {
    if (input.startsWith("/")) {
      return this.handleCommand(input);
    }

    if (!this._auth.authenticated) {
      const message = new Message(
        this._chatServer,
        this,
        "You are not authenticated. Type /AUTH to authenticate.",
      );
      return new Response(true, message);
    }

    return this.broadcast(input);
  }

  joinChannel(name: string) {
    if (!name) {
      const message = new Message(
        this._chatServer,
        this,
        "You must supply a channel name. Type /HELP for help.",
      );
      return new Response(true, message);
    }

    // does this channel exist?
    if (this._chatServer.channels[name]) {
      const messages: Message[] = [];

      // are you already a member of this channel?
      if (Object.keys(this._chatServer.channels[name].members).includes(this.auth.username!)) {
        messages.push(
          new Message(
            this.chatServer,
            this,
            `You are already a member of #${name}. Did you mean to /SWITCH?`,
          ),
        );

        return new Response(true, messages);
      }

      messages.concat(this._chatServer.channels[name].addMember(this));
      this._channels[name] = this._chatServer.channels[name];
      this.switchActiveChannel(name);

      messages.push(
        new Message(
          this._chatServer,
          this,
          `Joined ${name}. There are ${this._channels[name].memberCount} users here.`,
        ),
      );
      return new Response(true, messages);
    }

    // channel doesn't exist, create it
    const channel = new Channel(name, this);
    this._channels[name] = channel;
    this.switchActiveChannel(name);

    const message = new Message(
      channel,
      this,
      `Joined ${name}. There are ${this._channels[name].memberCount} users here.`,
    );
    return new Response(true, message);
  }

  kickMember(username: string, channel: string) {
    // does this channel exist
    if (!this._chatServer.channels[channel]) {
      const message = new Message(this._chatServer, this, `Channel ${channel} doesn't exist.`);
      return new Response(true, message);
    }

    // is this client a channel admin?
    if (this._chatServer.channels[channel].admin._auth.username !== this._auth.username) {
      const message = new Message(this._chatServer, this, `You aren't an admin of ${channel}.`);
      return new Response(true, message);
    }

    // Does this client exist?
    const client = this._chatServer.clients[username];
    if (!client) {
      const message = new Message(
        this._chatServer,
        this,
        `${username} isn't a member of the server.`,
      );
      return new Response(true, message);
    }

    // Is this client a member of the channel you want to kick them from?
    if (!client.channels[channel]) {
      const message = new Message(
        this._chatServer,
        this,
        `${username} isn't a member of ${channel}.`,
      );
      return new Response(true, message);
    }

    // Disable with extreme prejudice
    return this._chatServer.channels[channel].kick(client, this);
  }

  leaveChannel(name: string) {
    if (!name) {
      const message = new Message(
        this._chatServer,
        this,
        "You must supply a channel name. Type /HELP for help.",
      );
      return new Response(true, message);
    }

    // if the channel doesn't exist, bail
    if (!this._chatServer.channels[name]) {
      const message = new Message(
        this._chatServer,
        this,
        `Channel ${name} doesn't exist. Type /HELP for help.`,
      );
      return new Response(true, message);
    }

    // channel exists, leave it
    const channel = this._chatServer.channels[name];
    const removalMessage = channel.removeMember(this);
    delete this._channels[name];

    const message = new Message(
      this._chatServer,
      channel,
      `${this.nickname} left ${channel.name}.`,
    );

    // if left channel was active channel, unset active channel
    if (this.activeChannel && name === this.activeChannel.name) {
      this._activeChannel = null;
    }

    return new Response(true, [message, removalMessage]);
  }

  listCommands() {
    const message = new Message(
      this._chatServer,
      this,
      `
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
      # /HERE - List users in this channel.
      # /SWITCH <channel name> - Switch to a channel you're a member of.
      # /WHISPER <username> <message> - Send a private message.
      #####################################################################################################
    `,
    );
    return new Response(true, message);
  }

  removeActiveChannel() {
    this._activeChannel = null;
    return true;
  }

  send(message: string) {
    return this.writeLine(message);
  }

  showActiveChannel() {
    if (!this.activeChannel) {
      const message = new Message(this._chatServer, this, `You have no active channel.`);
      return new Response(true, message);
    }

    const message = new Message(
      this._chatServer,
      this,
      `${this.activeChannel.name} is your active channel.`,
    );
    return new Response(true, message);
  }

  showActiveChannelActiveMembers() {
    if (!this.activeChannel) {
      const message = new Message(this._chatServer, this, `You have no active channel.`);
      return new Response(true, message);
    }

    const messages = [];
    const message = new Message(this._chatServer, this, "Members here:");
    messages.push(message);
    Object.keys(this.activeChannel.members).forEach((username) => {
      const message = new Message(this._chatServer, this, username);
      messages.push(message);
    });

    return new Response(true, messages);
  }

  showAllChannels() {
    const channels = Object.keys(this._chatServer.channels);
    if (!channels.length) {
      const message = new Message(
        this._chatServer,
        this,
        "There are no public channels on the server. Create one!",
      );
      return new Response(true, message);
    }

    const messages = [];
    const message = new Message(this._chatServer, this, "Global channels:");
    messages.push(message);
    channels.forEach((name) => {
      const message = new Message(this._chatServer, this, `#${name}`);
      messages.push(message);
    });

    return new Response(true, messages);
  }

  showUserChannels() {
    const channels = Object.keys(this._channels);
    if (!channels.length) {
      const message = new Message(this._chatServer, this, "You haven't joined any channels.");
      return new Response(true, message);
    }

    const messages = [];
    const message = new Message(this._chatServer, this, "Your channels:");
    messages.push(message);
    channels.forEach((name) => {
      const message = new Message(
        this._chatServer,
        this,
        `#${name}${name === this.activeChannel!.name ? "* (active channel)" : ""}`,
      );
      messages.push(message);
    });

    return new Response(true, messages);
  }

  switchActiveChannel(name: string) {
    if (!this.chatServer.channels[name]) {
      const message = new Message(this._chatServer, this, `That's not a valid channel.`);
      return new Response(true, message);
    }

    if (!this.channels[name]) {
      const message = new Message(this._chatServer, this, `You aren't a member of ${name}.`);
      return new Response(true, message);
    }

    // no previously active channel
    if (!this.activeChannel) {
      this._activeChannel = this.channels[name];
      const message = new Message(
        this._chatServer,
        this,
        `There are ${this.activeChannel!.memberCount} users here.`,
      );
      return new Response(true, message);
    }

    // desired channel is already active channel
    if (this.activeChannel.name === name) {
      return true;
    }

    const previousChannel = this.activeChannel;

    // switch the channel
    this._activeChannel = this.channels[name];

    const messages = [];
    const message = new Message(
      this._chatServer,
      this,
      `Switched active channel to ${name}. There are ${this.activeChannel.memberCount} users here.`,
    );

    messages.push(
      this.activeChannel.broadcastAsSystem(`${this.nickname} joined ${this.activeChannel.name}.`),
    );
    messages.push(
      previousChannel.broadcastAsSystem(`${this.nickname} left ${this.activeChannel.name}.`),
    );

    return new Response(true, message);
  }

  updateNickname(newNickname: string) {
    this._nickname = newNickname;
    const message = new Message(this.chatServer, this, "Nickname updated");
    return message;
  }

  whisper(user: string, content: string) {
    const currentTime = new Date().toLocaleTimeString();

    const message = new Message(
      this,
      this.chatServer.clients[user],
      `(whisper) <${this.nickname}> ${content}`,
    );

    return new Response(true, message);
  }

  write(msg: string) {
    this._socket.write(msg);
    return true;
  }

  writeLine(msg: string) {
    return this.write(appendNewLine(msg));
  }
}
