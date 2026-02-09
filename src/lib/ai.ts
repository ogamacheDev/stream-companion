import {Socket} from "socket.io-client";
import {toast} from "sonner";
import * as stronghold from "@/lib/stronghold.ts"

const init = (client: Socket, apiKey: string, context: string, callback: (res: boolean) => void) => {
    toast.promise(new Promise(async (resolve, reject) => {
        client.emit("ai:init", {
            apiKey: apiKey,
            message: JSON.stringify({
                type: "system",
                context: context
            })
        }, (res: any) => {
            console.log(res)

            if (res.success) {
                resolve("");
                callback(true);
                return;
            }

            reject("")
            callback(false);
        })
    }), {
        loading: "Starting AI Companion...",
        success: "AI Companion started successfully",
        error: "Failed to start AI Companion"
    })
}

const fetchAPIKey = async () => {
    const { getRecord } = await stronghold.init();
    if (!getRecord) return;

    return await getRecord("apiKey");
}

const updateAPIKey = async (key: string) => {
    const { insertRecord } = await stronghold.init();
    if (!insertRecord) return;
    await insertRecord("apiKey", key);
}

export { init, fetchAPIKey, updateAPIKey }