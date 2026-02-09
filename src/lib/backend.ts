import {io, Socket} from "socket.io-client";

let client: Socket;

const init = () => {
    client = io("127.0.0.1:8754").connect();

    client.on("connect", () => {
        console.log("Websocket: Connected")
    })

    return client;
}

export { init, client }