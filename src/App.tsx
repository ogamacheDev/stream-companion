import "./App.css";
import {ConfigForm} from "@/components/ConfigForm.tsx";
import {MessageForm} from "@/components/MessageForm.tsx";
import {useEffect, useState} from "react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {backendInit, getAiState, startAi} from "@/lib/backend.ts";

function App() {
  const [backendReady, setBackendReady] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  useEffect(() => {
      backendInit().then(async (success) => {
          if (success) {
              setBackendReady(true);

              const state = await getAiState();
              if (state) {
                  setAiReady(true);
                  return;
              }

              const success = await startAi();
              if (success) {
                  setAiReady(true);
              }
          }
      })
  }, []);

  return (
    <main className="w-full h-screen grid lg:grid-cols-2">
          <ScrollArea className="flex flex-col lg:h-screen bg-gray-100">
            <div className="flex flex-col px-8 py-12 gap-y-12">
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
                Configuration
              </h1>
              <ConfigForm backendReady={backendReady} aiReady={aiReady} setAiReady={setAiReady} />
            </div>
          </ScrollArea>
        <div className="flex flex-col w-full px-8 py-12 bg-gray-200">
          <MessageForm isAiReady={aiReady} />
        </div>
    </main>
  );
}

export default App;
