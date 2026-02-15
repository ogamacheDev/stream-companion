import {startAI, messageAi, getAiState} from "./src/ai.js";
import {Server} from "socket.io";
import {WebSocketServer} from "ws";

type AiConfig = {
    apiKey: string;
    message: string;
}

let aiConfig: AiConfig;

const wss = new WebSocketServer({
    port: 6562
})

wss.on("connection", (client) => {
    console.log("Websocket: Connected");

    client.on("message", async (data) => {
        const message = data.toString();
        const json = JSON.parse(message);
        console.log(json);

        if (json.type === "event") {
            console.log("Websocket: Prompting");
            const res = await messageAi(message);
            console.log(res);

            if (res.success && typeof res.message == "string") {
                console.log("Websocket: Sending Message")
                client.send(JSON.stringify({
                    silent: json.silent,
                    message: res.message
                }));
            }
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

    socket.on('disconnect', () => {
        console.log("Socket.io: Disconnected");
    })
});

io.listen(8754)