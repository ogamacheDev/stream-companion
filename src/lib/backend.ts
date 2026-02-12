import {toast} from "sonner";
import {io, Socket} from "socket.io-client";
import {invoke} from "@tauri-apps/api/core";
import {fetchConfig, strongholdInit} from "@/lib/config.ts";

let socket: Socket;

const backendInit = async () => {
    return new Promise<boolean>(async (resolve, reject) => {
        try {
            await strongholdInit();

            socket = io("127.0.0.1:8754", {
                auth: {
                    token: await invoke("get_auth_token")
                }
            }).connect();

            socket.on("connect", () => {
                console.log("Socket.io: Connected");
                resolve(true);
                return true;
            })

            socket.on("connect_error", (error) => {
                console.error(error);
                reject();
                return;
            })

            socket.on("disconnect", (message) => {
                console.log("Socket.io: Disconnected", message)
            })
        } catch (error) {
            console.error(error);
            reject();
            return;
        }
    })
}

const getAiState = async () => {
    if (!socket) console.error("Socket not initialized!");
    return new Promise<boolean>(async (resolve, reject) => {
        try {
            socket.emit("ai:status", (res: boolean) => {
                resolve(res);
            })
        } catch (error) {
            console.error(error)
            reject();
        }
    });
}

const startAi = async () => {
    const startPromise = new Promise<boolean>(async (resolve, reject) => {
        try {
            const { apiKey, config } = await fetchConfig();
            socket.emit("ai:start", {
                apiKey: apiKey,
                message: JSON.stringify({
                    type: "system",
                    context: config.context
                })
            }, (res: any) => {
                if (res.success) {
                    resolve(true);
                    return;
                }
                console.log("AI Companion failed to start", res)
                reject();
            })
        } catch (error) {
            console.error(error)
            reject();
        }
    });

    toast.promise(startPromise, {
        loading: "Starting AI Companion...",
        success: "AI Companion started successfully!",
        error: "Failed to start AI Companion."
    })

    return startPromise;
}

const messageAi = async (message: string) => {
    const messagePromise = new Promise(async (resolve, reject) => {
        socket.emit("ai:message", JSON.stringify({ type: "event", message: message }),
            (res: any) => {
                console.log(res)
                if (res.success) {
                    resolve(res.message);
                    return;
                }
                reject();
            })
    });

    toast.promise(messagePromise, {
        loading: "Sending...",
        success: "Message Sent!",
        error: "Error",
    });

    return messagePromise;
}

export { backendInit, startAi, messageAi, getAiState }