import "./App.css";
import {ConfigForm} from "@/components/ConfigForm.tsx";
import {MessageForm} from "@/components/MessageForm.tsx";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import * as backend from "@/lib/backend.ts"
import * as ai from "@/lib/ai.ts"
import * as config from "@/lib/config.ts"
import {Config} from "@/lib/config.ts";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {client} from "@/lib/backend.ts";
import {updateAPIKey} from "@/lib/ai.ts";

function App() {
  const [userConfig, setUserConfig] = useState<Config>({ context: "" })
  const [configLoadingState, setConfigLoadingState] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [aiState, setAiState] = useState(false)

  const configFormHandler = async (event: any, key: any) => {
    event.preventDefault();
    setConfigLoadingState(true);

    toast.promise(() => new Promise(async (resolve) => {
      await config.save(userConfig)

      if (!key) {
        key = apiKey;
      }

      setAiState(false);
      await updateAPIKey(key);
      ai.init(client, key, userConfig.context, async (res) => {
        if (res) {
          setAiState(true);
          return;
        }
      })

      setConfigLoadingState(false);
      resolve({});
    }), {
      loading: "Saving...",
      success: () => `Settings have been saved!`,
      error: "Error",
    })
  }
  useEffect(() => {
    backend.init()

    toast.promise(new Promise(async (resolve) => {
      const fetchedConfig = await config.fetch();
      setUserConfig(fetchedConfig);

      const key = await ai.fetchAPIKey();
      setApiKey(key ?? "");

      ai.init(client, key ?? "", fetchedConfig.context, (res) => {
        setAiState(res);
      });

      setConfigLoadingState(false);
      resolve({})
    }), {
      loading: "Loading configuration...",
      success: () => `Configuration has been loaded!`,
      error: "Error",
    })

  }, []);

  return (
    <main className="w-full h-screen grid lg:grid-cols-2">
          <ScrollArea className="flex flex-col lg:h-screen bg-gray-100">
            <div className="flex flex-col px-8 py-12 gap-y-12">
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
                Configuration
              </h1>
              <ConfigForm userConfig={userConfig} setUserConfig={setUserConfig} apiKey={apiKey} setApiKey={setApiKey} formHandler={configFormHandler} isLoading={configLoadingState} isOnline={aiState} />
            </div>
          </ScrollArea>
        <div className="flex flex-col w-full px-8 py-12 bg-gray-200">
          <MessageForm isAiReady={aiState} />
        </div>
    </main>
  );
}

export default App;
