import {Client, Stronghold} from "@tauri-apps/plugin-stronghold";
import {appDataDir, join} from "@tauri-apps/api/path";
import {getPassword, setPassword} from "tauri-plugin-keyring-api";
import generator from "generate-password-ts";
import {BaseDirectory, exists, mkdir, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";

interface Config {
    context: string
}

let stronghold: Stronghold
let strongholdClient: Client;
const defaultConfig: Config = {
    context: ""
}

const vaultPath = await join(await appDataDir(), 'vault.hold');
const service = "com.olliedev.stream-companion";
const user = "stronghold-vault";
const clientName = 'api-keys-client';

const strongholdInit = async () => {
    let password = await getPassword(service, user);

    if (!password) {
        password = generator.generate({
            length: 24,
            numbers: true,
            symbols: true,
        });

        await setPassword(service, user, password);
    }

    stronghold = await Stronghold.load(vaultPath, password);
    try {
        strongholdClient = await stronghold.loadClient(clientName);
    } catch {
        strongholdClient = await stronghold.createClient(clientName);
    }
}

const getRecord = async (key: string): Promise<string> => {
    if (!strongholdClient) {
        throw new Error("Stronghold client not initialized!");
    }

    const store = strongholdClient.getStore();
    const data = await store.get(key);

    if (!data || data.length === 0) {
        console.warn(`No data found for key: ${key}`);
        return "";
    }

    return new TextDecoder().decode(new Uint8Array(data));
}

const insertRecord = async (key: string, value: string) => {
    if (!strongholdClient) {
        throw new Error("Stronghold client not initialized!");
    }

    const store = strongholdClient.getStore()
    const data = Array.from(new TextEncoder().encode(value));

    await store.insert(key, data);
    await stronghold.save();
}

const setupConfigLocation = async () => {
    const folderExists = await exists('', {
        baseDir: BaseDirectory.AppData
    })

    if (!folderExists) {
        await mkdir('', {
            baseDir: BaseDirectory.AppData
        })
    }
}

const saveConfig = async (config: Config) => {
    await setupConfigLocation();
    await writeTextFile('config.json', JSON.stringify(config, null, 2), {
        baseDir: BaseDirectory.AppData
    });
}

const fetchConfig = async () => {
    await setupConfigLocation();
    const fileExists = await exists('config.json', {
        baseDir: BaseDirectory.AppData
    })

    if (!fileExists) {
        await writeTextFile('config.json', JSON.stringify(defaultConfig, null, 2), {
            baseDir: BaseDirectory.AppData
        });

        return defaultConfig;
    }

    const config = await readTextFile("config.json", {
        baseDir: BaseDirectory.AppData
    })

    try {
        return JSON.parse(config);
    } catch {
        throw new Error("Failed to parse config.");
    }
}

export { strongholdInit, saveConfig, fetchConfig, getRecord, insertRecord }
export type { Config }