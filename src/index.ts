import http from "http";
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

// Set up HTTP server
const httpHost = "localhost";
const httpServerPort = 8123;

const requestListener = function (req: any, res: any) {
  res.setHeader("Content-Type", "text/plain");
  switch (req.url) {
    case "/login":
      if (req.method !== "POST") {
        res.writeHead(400);
        res.end("You must send a POST with your desired username.");
        break;
      }

      let body = "";

      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        console.log(body);

        if (body.split(" ").length > 1) {
          res.writeHead(400);
          res.end("Username cannot contain spaces");
        }

        res.writeHead(200);
        res.end(`login with ${body}`);
      });

      break;
    case "/logout":
      res.writeHead(200);
      res.end("logout");
      break;
    default:
      res.writeHead(404);
      res.end("Not found");
  }
};

const httpServer = http.createServer(requestListener);

httpServer.listen(httpServerPort, httpHost, () => {
  console.log(`HTTP server is running on http://${httpHost}:${httpServerPort}`);
});
