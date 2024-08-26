# Telnet Chat Server

A Basic Telnet chat server, built with TypeScript.

<p align="center">
  <img alt="Party Chat Logo" src="https://github.com/user-attachments/assets/8888433f-acb9-457f-b38f-fbd79686c32c" />
</p>

![Party Chat - Welcome Screen](https://github.com/jchiatt/telnet-chat-server/blob/master/img/welcome.png?raw=true)
![Party Chat - Welcome Screen](https://github.com/jchiatt/telnet-chat-server/blob/master/img/chat.png?raw=true)


## Setup

First, install dependencies:

```
yarn
```

Then, if desired, update the configuration values in `src/config/chat.config.ts`.

## Running the app

```
yarn build && yarn start
```

## Usage

Establish a client session:

```
telnet localhost 8023

```

> Important: You'll need to authenticate before you'll be able to run any other commands. Type `/login <username>` to authenticate.

![Party Chat - Welcome Screen](https://github.com/jchiatt/telnet-chat-server/blob/master/img/help.png?raw=true)

### Commands

| Command                         | Description                                    |
| ------------------------------- | ---------------------------------------------- |
| /CHANNEL                        | List your active channel.                      |
| /CHANNELS                       | List all available channels.                   |
| /JOIN <channel name>            | Join a channel, create if it doesn't exist.    |
| /KICK <channel name> <username> | Kick a user from a channel you're an admin of. |
| /LEAVE <channel name>           | Leave a channel.                               |
| /LOGIN <desired username>       | Authenticate with the server.                  |
| /LOGOUT                         | Log out.                                       |
| /MEMBER                         | List channels you've joined.                   |
| /NICK <new display name>        | Change your display name.                      |
| /HELP                           | List available commands.                       |
| /HERE                           | List users in this channel.                    |
| /SWITCH <channel name>          | Switch to a channel you're a member of.        |
| /WHISPER <username> <message>   | Send a private message.                        |

Have fun!
