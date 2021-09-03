import { Auth } from "./client/Auth";
import { ChatServer } from "./server/ChatServer";
import { Client } from "./client/Client";

type Clients = Record<string, Client>;

export { Auth, ChatServer, Client, Clients };
