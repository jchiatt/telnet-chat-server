import { initConfig } from "./config/initConfig";
import { setupLogging } from "./helpers/logToFile";
import { ChatServer } from "./server/ChatServer";
import { handleClientConnection } from "./server/handleClientConnection";
import { handleClose } from "./server/handleClose";
import { handleError } from "./server/handleError";

// Initialize config
const chatServerConfig = initConfig();

// Set up application logging
setupLogging(chatServerConfig);
const chatServer = new ChatServer(chatServerConfig);

// Listen for connection events
chatServer.onConnection(handleClientConnection(chatServer));

// Listen for close events
chatServer.onClose(handleClose);

// Listen for error events
chatServer.onError(handleError);

// Listen for connections on port specified in config
chatServer.listen();
