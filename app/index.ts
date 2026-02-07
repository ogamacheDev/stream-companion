import * as z from 'zod'
import {createAgent} from "langchain";
import WebSocket, { WebSocketServer } from 'ws';
// import { Client, Stronghold } from '@tauri-apps/plugin-stronghold';
// import { appDataDir } from '@tauri-apps/api/path';

// const initStronghold = async () => {
//     const vaultPath = `${await appDataDir()}/vault.hold`;
//     const vaultPassword = 'vault password';
//     const stronghold = await Stronghold.load(vaultPath, vaultPassword);
//
//     let client: Client;
//     const clientName = 'name your client';
//     try {
//         client = await stronghold.loadClient(clientName);
//     } catch {
//         client = await stronghold.createClient(clientName);
//     }
//
//     return {
//         stronghold,
//         client,
//     };
// };

const wss = new WebSocketServer({ port: 8754 });

wss.on('connection', async (ws: WebSocket) => {
    // const { stronghold, client } = await initStronghold();

    ws.on('message', (message: any) => {
        try {
            const json = JSON.parse(message);
            console.log(`Recieved: ${json.message}`);
            ws.send(`Recieved: ${json.message}`);

            switch (json.request) {
                case "openai:init":
                    console.log("openai:init");
            }

        } catch (e) {
            console.error(e);
            ws.send(`Invalid JSON: ${message}`);
        }
    });
});
