import {toast} from "sonner";
import {io, Socket} from "socket.io-client";
import {invoke} from "@tauri-apps/api/core";
import {fetchConfig, getRecord, strongholdInit} from "@/lib/config.ts";
import {info, error} from "@tauri-apps/plugin-log";

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

            socket.on("connect", async () => {
                await info("Backend: Connected");
                resolve(true);
                return true;
            })

            socket.on("connect_error", async (message) => {
                await error("Backend: Connection Error");
                await error(message.toString());
                reject();
                return;
            })

            socket.on("disconnect", (message) => {
                console.log("Backend: Disconnected", message)
            })
        } catch (message) {
            await error(message?.toString() ?? "")
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
        } catch (message) {
            await error(message?.toString() ?? "")
            reject();
        }
    });
}

const startAi = async () => {
    const startPromise = new Promise<boolean>(async (resolve, reject) => {
        try {
            const config = await fetchConfig();
            const apiKey = await getRecord("apiKey");

            if (apiKey) {
                socket.emit("ai:start", {
                    apiKey: apiKey,
                    message: JSON.stringify({
                        type: "system",
                        context: config.context
                    })
                }, async (res: any) => {
                    if (res.success) {
                        resolve(true);
                        return;
                    }
                    reject(res.messages);
                    return;
                })
            } else {
                reject("No API Key Found, please setup the OpenAI Integration.");
            }
        } catch (message) {
            await error(message?.toString() ?? "")
            reject(message);
        }
    });

    toast.promise(startPromise, {
        loading: "Starting AI Companion...",
        success: "AI Companion started successfully!",
        error: (error) => `Failed to start AI Companion: ${error}`
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