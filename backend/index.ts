import {startAI, messageAi, getAiState} from "./src/ai.js";
import {Server} from "socket.io";
import {WebSocketServer} from "ws";

type AiConfig = {
    apiKey: string;
    message: string;
}

let aiConfig: AiConfig;
let sendMessage = (message: string) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(message)
        }
    })
}

const wss = new WebSocketServer({
    port: 6562
})

wss.on("connection", (client) => {
    console.log("Websocket: Connected");

    client.on("message", async (data) => {
        console.log("Websocket: Prompting");
        const res = await messageAi(data.toString());
        console.log(`Websocket: ${res.message}`);

        if (res.success && typeof res.message == "string") {
            console.log("Websocket: Sending Message")
            sendMessage(res.message);
        }
    })

    client.on("close", () => {
        console.log("Websocket: Disconnected");
    })
})

const io = new Server({
    cors: {
        origin: ["http://localhost:1421", "http://tauri.localhost"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use(async (socket, next) => {
    if (!process.env.AUTH_TOKEN) {
        next();
        return;
    }

    const token = socket.handshake.auth.token;

    if (!token || token !== process.env.AUTH_TOKEN) {
        console.log("Socket.io: Unauthorized")
        return next(new Error("401 Not Authorized"));
    }
    console.log("Socket.io: Authenticated")

    next();
});

io.on("connection", (socket) => {
    console.log("Socket.io: Connected");

    socket.on("ai:start", async (config: AiConfig, callback) => {
        aiConfig = config;
        callback(await startAI(config));
    })

    socket.on("ai:status" , (callback) => {
        console.log("Socket.io: Status Check");
        callback(getAiState());
    })

    socket.on("ai:message", async (message: string, callback) => {
        console.log("Socket.io: Prompting");
        const res = await messageAi(message);

        console.log(`Socket.io: ${res.message}`);
        if (res.success && typeof res.message == "string") {
            console.log("Socket.io: Sending Message");
            sendMessage(res.message);
        }

        console.log("Socket.io: Callback");
        callback(res);
    })

    socket.on('disconnect', () => {
        console.log("Socket.io: Disconnected");
    })
});

io.listen(8754)