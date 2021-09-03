import { ChatServer } from "./server/ChatServer";
import { handleClientConnection } from "./server/handleClientConnection";
import { handleClose } from "./server/handleClose";
import { handleError } from "./server/handleError";

const chatServer = new ChatServer();

// Listen for connection events
chatServer.onConnection(handleClientConnection(chatServer));

// Listen for close events
chatServer.onClose(handleClose);

// Listen for error events
chatServer.onError(handleError);

// Listen for connections on port 8023
chatServer.listen(8023);
