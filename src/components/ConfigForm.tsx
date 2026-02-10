import {Field, FieldDescription, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
// import {
//     Combobox,
//     ComboboxContent,
//     ComboboxEmpty,
//     ComboboxInput,
//     ComboboxItem,
//     ComboboxList
// } from "@/components/ui/combobox"
import {Status} from "@/components/Status.tsx";
import {toast} from "sonner";
import {client} from "@/lib/backend.ts";
import {updateAPIKey} from "@/lib/ai.ts";
import {Dispatch, SetStateAction, useEffect, useRef, useState} from "react";
import {Config} from "@/lib/config.ts";
import * as config from "@/lib/config.ts";
import * as ai from "@/lib/ai.ts";

// const aiModels = [
//     "gpt-4o"
// ]

const ConfigForm = ({backendReady, aiReady, setAiReady}: { backendReady: boolean, aiReady: boolean, setAiReady: Dispatch<SetStateAction<boolean>> }) => {
    const apiKeyInputRef = useRef<HTMLInputElement>(null);
    const [userConfig, setUserConfig] = useState<Config>({ context: "" })
    const [loadingState, setLoadingState] = useState(true);

    const updateConfig = (data: any) => {
        const newConfig = {...userConfig, ...data};
        setUserConfig(newConfig);
    }

    const configFormHandler = async (event: any) => {
        event.preventDefault();
        setLoadingState(true);

        const key = apiKeyInputRef.current?.value ?? "";

        toast.promise(() => new Promise(async (resolve, reject) => {
            await config.save(userConfig)
            await updateAPIKey(key);

            if (key) {
                setAiReady(false);
                ai.restart(client, userConfig.context, async (res) => {
                    if (res) {
                        setAiReady(true);
                        return;
                    }
                    reject("");
                })
            }

            resolve("");
            setLoadingState(false);
        }), {
            loading: "Saving...",
            success: () => `Settings have been saved!`,
            error: "Failed to save settings",
        })
    }

    const restartHandling = async () => {
        setLoadingState(true);

        const fetchedConfig = await config.fetch();
        setAiReady(false);

        ai.restart(client, fetchedConfig.context, async (res) => {
            setAiReady(res);
        })

        setLoadingState(false);
    }

    useEffect(() => {
        if (backendReady) {
            toast.promise(new Promise(async (resolve, revoke) => {
                try {
                    const fetchedConfig = await config.fetch();
                    const apiKey = await ai.fetchAPIKey();

                    if (apiKey && apiKeyInputRef.current) {
                        apiKeyInputRef.current.value = apiKey;
                        ai.init(client, apiKey, fetchedConfig.context, (res) => {
                            if (res) {
                                setAiReady(true);
                                resolve("");
                                return;
                            }
                            revoke("");
                        });
                    }

                    setUserConfig(fetchedConfig);
                    resolve("")
                } catch (e) {
                    console.error(e)
                    revoke("");
                }

                setLoadingState(false);
            }), {
                loading: "Loading configuration...",
                success: () => `Configuration has been loaded!`,
                error: "Failed to load configuration, falling back to default config.",
            })
        }
    }, [apiKeyInputRef, backendReady]);

    return (
        <form onSubmit={configFormHandler}>
            <FieldGroup>
                <div className="flex gap-3 items-center">
                    <Status state={aiReady} />
                    <h2 className="scroll-m-20 text-3xl font-semibold tracking-none first:mt-0">
                        AI Companion
                    </h2>
                </div>
                <FieldGroup className="grid">
                    {/*<Field>*/}
                    {/*    <Label htmlFor="aimodel">AI Model</Label>*/}
                    {/*    <FieldDescription>Choose which AI Model you want to use.</FieldDescription>*/}
                    {/*    <Combobox id="aimodel" value="gpt-4o" items={aiModels}>*/}
                    {/*        <ComboboxInput disabled placeholder="Select an AI Model" />*/}
                    {/*        <ComboboxContent>*/}
                    {/*            <ComboboxEmpty>No items found.</ComboboxEmpty>*/}
                    {/*            <ComboboxList>*/}
                    {/*                {(item) => (*/}
                    {/*                    <ComboboxItem key={item} value={item}>*/}
                    {/*                        {item}*/}
                    {/*                    </ComboboxItem>*/}
                    {/*                )}*/}
                    {/*            </ComboboxList>*/}
                    {/*        </ComboboxContent>*/}
                    {/*    </Combobox>*/}
                    {/*</Field>*/}
                    <Field>
                        <Label htmlFor="apikey" className="mb-1">API Key</Label>
                        <FieldDescription>Enter your API Key here.</FieldDescription>
                        <Input ref={apiKeyInputRef} id="apikey" type="password" placeholder="sk-proj..." disabled={loadingState} />
                    </Field>
                </FieldGroup>
                <Field>
                    <Label htmlFor="aicontext">AI Context</Label>
                    <FieldDescription>Describe how you want your companion to behave!</FieldDescription>
                    <Textarea id="aicontext" className="max-h-40" placeholder="You are a..."
                              disabled={loadingState} onChange={(e) => updateConfig({context: e.target.value})}
                              value={userConfig.context ?? ""}/>
                </Field>
                <Field orientation="horizontal">
                    <Button type="submit" disabled={loadingState}>
                        Save
                    </Button>
                    <Button onClick={restartHandling} type="button" disabled={loadingState || !aiReady}>
                        Restart
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}

export { ConfigForm }