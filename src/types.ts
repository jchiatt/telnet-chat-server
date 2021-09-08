import { Auth } from "./client/Auth";
import { Channel } from "./server/Channel";
import { ChatServer } from "./server/ChatServer";
import { Client } from "./client/Client";

type Clients = Record<string, Client>;
type Channels = Record<string, Channel>;
type ChatServerConfig = {
  port: number;
  logFiles: logFilesConfig;
};
type logFilesConfig = {
  app: string;
  error: string;
};

export { Auth, Channel, Channels, ChatServer, ChatServerConfig, Client, Clients, logFilesConfig };
