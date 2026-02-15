import "./App.css";
import {ConfigForm} from "@/components/ConfigForm.tsx";
import {useEffect, useState} from "react";
import {backendInit, getAiState, startAi} from "@/lib/backend.ts";
import {IntegrationsForm} from "@/components/IntegrationsForm.tsx";

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
        <main className="w-full flex flex-col px-8 py-12 gap-y-12">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
                Configuration
            </h1>
            <ConfigForm backendReady={backendReady} aiReady={aiReady} setAiReady={setAiReady} />
            <IntegrationsForm setAiReady={setAiReady} />
        </main>
    );
}

export default App;
