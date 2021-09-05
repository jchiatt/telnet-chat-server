import { Socket } from "net";
import { ChatServer } from "./ChatServer";
import { newLine } from "../constants";

export const handleClientConnection = (chatServer: ChatServer) => {
  return (socket: Socket) => {
    // set socket encoding
    socket.setEncoding("utf-8");

    // set up a client
    const client = chatServer.createClient(socket);

    // handle input from client
    socket.on("data", (data) => {
      // data comes in as a buffer
      let bufferToString = data.toString();

      // if data ends with a new line, enter has been pressed
      if (bufferToString.endsWith(newLine)) {
        bufferToString = bufferToString.replace(newLine, "");

        const response = client.handleInput(bufferToString);
        if (response) {
          // @ts-expect-error
          chatServer.handleResponse(response);
        }
      }
    });

    // clean up when a client disconnects
    socket.on("close", () => {
      const removed = chatServer.deleteClient(client);
      const remoteAddr = removed.ip;

      console.log(`Connection from ${remoteAddr} closed.`);
    });
  };
};
