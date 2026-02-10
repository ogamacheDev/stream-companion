import {appDataDir, join} from "@tauri-apps/api/path";
import {getPassword, setPassword} from "tauri-plugin-keyring-api";
import {Client, Stronghold} from "@tauri-apps/plugin-stronghold";
import generator from 'generate-password-ts';

const VAULT_FILENAME = 'vault.hold';
const CLIENT_NAME = 'api-keys-client';

const init = async ()=> {
    const vaultPath = await join(await appDataDir(), VAULT_FILENAME);
    const service = "com.olliedev.stream-companion";
    const user = "stronghold-vault";

    let password = await getPassword(service, user);

    if (!password) {
        password = generator.generate({
            length: 24,
            numbers: true,
            symbols: true,
        });

        await setPassword(service, user, password);
    }

    try {
        let client: Client;
        const stronghold = await Stronghold.load(vaultPath, password);

        try {
            client = await stronghold.loadClient(CLIENT_NAME);
        } catch {
            client = await stronghold.createClient(CLIENT_NAME);
        }
        console.log("Stronghold loaded successfully");

        const getRecord = async (key: string): Promise<string> => {
            try {
                const store = client.getStore();
                const data = await store.get(key);

                if (!data || data.length === 0) {
                    console.warn(`No data found for key: ${key}`);
                    return "";
                }

                return new TextDecoder().decode(new Uint8Array(data));
            } catch (error) {
                console.error(`Error retrieving record for key '${key}':`, error);
                throw error;
            }
        }
        const insertRecord = async (key: string, value: string) => {
            try {
                const store = client.getStore()
                const data = Array.from(new TextEncoder().encode(value));

                await store.insert(key, data);
                await stronghold.save();
            } catch (error) {
                console.error(`Error saving record for key '${key}':`, error);
                throw error;
            }
        }

        return {
            getRecord,
            insertRecord
        };
    } catch (error) {
        console.error("Error loading Stronghold:", error);
        return {
            getRecord: null,
            insertRecord: null
        }
    }
}

export { init };