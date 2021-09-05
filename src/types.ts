import { Auth } from "./client/Auth";
import { Channel } from "./server/Channel";
import { ChatServer } from "./server/ChatServer";
import { Client } from "./client/Client";

type Clients = Record<string, Client>;
type Channels = Record<string, Channel>;

export { Auth, Channel, Channels, ChatServer, Client, Clients };
