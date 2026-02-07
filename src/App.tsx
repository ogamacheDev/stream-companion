import "./App.css";
import {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {appLocalDataDir} from "@tauri-apps/api/path";
import {Client, Stronghold} from "@tauri-apps/plugin-stronghold";
import {invoke} from "@tauri-apps/api/core";
let ws: WebSocket | null = null;

const initStronghold = async () => {
  const vaultPath = `${await appLocalDataDir()}/vault.hold`;
  const vaultPassword = await invoke<string>("vault_password");
  console.log(vaultPassword);
  const stronghold = await Stronghold.load(vaultPath, vaultPassword);

  let client: Client;
  const clientName = 'streamerbot-companion';
  try {
    client = await stronghold.loadClient(clientName);
  } catch {
    client = await stronghold.createClient(clientName);
  }

  return {
    stronghold,
    client,
  };
};

function connectWebSocket(setState: (state: boolean) => void) {
  const url = `ws://127.0.0.1:8754`;

  ws = new WebSocket(url);
  if (!ws) return false;

  ws.onopen = () => {
    setState(true);
    console.log('WebSocket Client Connected');
  };

  ws.onclose = () => {
    setState(false);
  };
}

// function sendMessage(message: string) {
//   console.log(`Sending message: ${message}`);
//   ws?.send(JSON.stringify({
//     message: message
//   }));
// }

async function insertRecord(store: any, key: string, value: string) {
  const data = Array.from(new TextEncoder().encode(value));
  await store.insert(key, data);
}

async function getRecord(store: any, key: string): Promise<string> {
  const data = await store.get(key);
  console.log(data);
  return new TextDecoder().decode(new Uint8Array(data));
}

function App() {
  const [state, setState] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [safe, setSafe] = useState<{stronghold: Stronghold, client: Client}>();

  const saveSettings = async () => {
    if (!safe) return;

    const store = safe.client.getStore();
    await insertRecord(store, "apikey", apiKey);
    await safe.stronghold.save();
    console.log("Saving settings...");
  }

  const getKey = async () => {
    if (!safe) return;

    const store = safe.client.getStore();
    return await getRecord(store, "apikey");
  }

  const firstLoad = useRef(false);
  useEffect(() => {
    if (firstLoad.current) return;
    firstLoad.current = true;

    initStronghold().then((safeData) => {
        console.log("Stronghold initialized.");
        setSafe(safeData);
      }
    );
    connectWebSocket(setState);
  }, []);

  return (
    <main className="flex flex-col items-start">
      <p>{state ? "Connected" : "Disconnected"}</p>
      {state && (
        <>
          <input onChange={(e) => setApiKey(e.target.value)} value={apiKey} type="text"/>
          <Button onClick={saveSettings}>Save</Button>
          <Button onClick={getKey}>Get Key</Button>
        </>
      )}
    </main>
  );
}

export default App;
