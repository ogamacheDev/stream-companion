import {appDataDir} from "@tauri-apps/api/path";
import {getPassword, setPassword} from "tauri-plugin-keyring-api";
import {Client, Stronghold} from "@tauri-apps/plugin-stronghold";

const VAULT_FILENAME = 'vault.hold';
const CLIENT_NAME = 'api-keys-client';

const init = async ()=> {
    const vaultPath = `${await appDataDir()}/${VAULT_FILENAME}`;
    const service = "com.olliedev.streamerbot-companion";
    const user = "stronghold-vault";

    let password = await getPassword(service, user);
    if (!password) {
        password = Math.random().toString(36);
        await setPassword(service, user, password);
    }

    let stronghold: Stronghold, client: Client;
    const getRecord = async (key: string): Promise<string> => {
        if (!client) {
            return "";
        }

        try {
            const store = client.getStore()
            const data = await store.get(key);

            if (!data || data.length === 0) {
                console.warn(`No data found for key: ${key}`);
                return "";
            }

            return new TextDecoder().decode(new Uint8Array(data));
        } catch (error) {
            console.error("Error retrieving record:", error);
            return "";
        }
    }
    const insertRecord = async (key: string, value: string) => {
        const store = client.getStore()
        const data = Array.from(new TextEncoder().encode(value));
        await store.insert(key, data);
        await stronghold.save();
    }

    try {
        stronghold = await Stronghold.load(vaultPath, password);
        try {
            client = await stronghold.loadClient(CLIENT_NAME);
        } catch {
            client = await stronghold.createClient(CLIENT_NAME);
        }
        console.log("Stronghold loaded successfully");
        return {
            getRecord: getRecord,
            insertRecord: insertRecord
        }
    } catch (error) {
        console.error("Error loading Stronghold:", error);
        return {
            getRecord: null,
            insertRecord: null
        }
    }
}

export { init };