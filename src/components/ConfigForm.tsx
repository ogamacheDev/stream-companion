import {Field, FieldDescription, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Status} from "@/components/Status.tsx";
import {Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import {startAi} from "@/lib/backend";
import {fetchConfig, saveConfig, Config} from "@/lib/config";
import {toast} from "sonner";

const ConfigForm = ({backendReady, aiReady, setAiReady}: { backendReady: boolean, aiReady: boolean, setAiReady: Dispatch<SetStateAction<boolean>> }) => {
    const apiKeyInputRef = useRef<HTMLInputElement>(null);
    const [userConfig, setUserConfig] = useState<Config>({ context: "" })
    const [isBlurred, setIsBlurred] = useState(true)
    const [loadingState, setLoadingState] = useState(true);

    const updateConfigHandler = (data: any) => {
        const newConfig = {...userConfig, ...data};
        setUserConfig(newConfig);
    }
    const saveHandler = async (event: any) => {
        event.preventDefault();

        const apiKey = apiKeyInputRef.current?.value ?? "";
        setLoadingState(true);
        setAiReady(false);

        const savePromise = new Promise<boolean> (async (resolve, reject) => {
            try {
                await saveConfig(userConfig, apiKey);
                resolve(true);

                if (apiKey) {
                    const success = await startAi()
                    if (success) {
                        setAiReady(true);
                    }
                    setLoadingState(false);
                }
            } catch (error) {
                console.error(error)
                reject();
            }
        })

        toast.promise(savePromise, {
            loading: "Saving configuration...",
            success: "Configuration saved successfully!",
            error: "Failed to save configuration."
        })
    }
    const restartHandler = async () => {
        setLoadingState(true);
        setAiReady(false);

        const success = await startAi()
        if (success) {
            setAiReady(true);
        }

        setLoadingState(false);
    }

    useEffect(() => {
        if (backendReady) {
            const loadingConfig = async () => {
                const fetchedConfig = await fetchConfig();

                setUserConfig(fetchedConfig.config);
                if (apiKeyInputRef.current) {
                    apiKeyInputRef.current.value = fetchedConfig.apiKey;
                }

                setLoadingState(false);
            }
            loadingConfig();
        }
    }, [apiKeyInputRef, backendReady]);

    return (
        <form onSubmit={saveHandler}>
            <FieldGroup>
                <div className="flex gap-3 items-center">
                    <Status state={aiReady} />
                    <h2 className="scroll-m-20 text-3xl font-semibold tracking-none first:mt-0">
                        AI Companion
                    </h2>
                </div>
                <FieldGroup className="grid">
                    <Field>
                        <Label htmlFor="apikey" className="mb-1">OpenAI API Key</Label>
                        <FieldDescription>Enter your OpenAI API Key here.</FieldDescription>
                        <Input ref={apiKeyInputRef} id="apikey" type={isBlurred ? "password" : "text"} placeholder="sk-proj..." onFocus={() => setIsBlurred(false)} onBlur={() => setIsBlurred(true)} disabled={loadingState} />
                    </Field>
                </FieldGroup>
                <Field>
                    <Label htmlFor="aicontext">AI Context</Label>
                    <FieldDescription>Describe how you want your companion to behave!</FieldDescription>
                    <Textarea id="aicontext" className="max-h-40" placeholder="You are a..."
                              disabled={loadingState} onChange={(e) => updateConfigHandler({context: e.target.value})}
                              value={userConfig.context ?? ""}/>
                </Field>
                <Field orientation="horizontal">
                    <Button type="submit" disabled={loadingState}>
                        Save
                    </Button>
                    <Button onClick={restartHandler} type="button" disabled={loadingState || !aiReady}>
                        Restart
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}

export { ConfigForm }