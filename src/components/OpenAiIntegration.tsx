import {Button} from "@/components/ui/button.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import {error} from "@tauri-apps/plugin-log";
import {startAi} from "@/lib/backend.ts";
import {insertRecord} from "@/lib/config.ts";
import {Field, FieldDescription, FieldGroup} from "@/components/ui/field.tsx";
import {Dispatch, SetStateAction, SubmitEventHandler, useRef, useState} from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";

const OpenAiIntegration = ({ setAiReady }: {setAiReady: Dispatch<SetStateAction<boolean>>}) => {
    const apiKeyInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState<boolean>(false)

    const openAISaveHandler: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        const saveAPIKeyPromise = new Promise(async (resolve, reject) => {
            try {
                if (!apiKeyInputRef.current) {
                    await error("API Key input reference is null.");
                    reject();
                    return;
                }
                await insertRecord("apiKey", apiKeyInputRef.current.value);
                setOpen(false);
                resolve("");
            } catch (message) {
                await error("Failed to save API Key");
            }
            setAiReady(false);
            await startAi();
            setAiReady(true);
        });

        toast.promise(saveAPIKeyPromise, {
            loading: "Saving...",
            success: "Saved OpenAI Config Successfully!",
            error: "Failed to save API Key.",
        });
    }

    return (
        <Field className="flex justify-start">
            <Label htmlFor="apikey">OpenAI</Label>
            <FieldDescription>Set the OpenAI Settings</FieldDescription>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button className="!w-fit">Setup</Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>OpenAI</SheetTitle>
                    </SheetHeader>
                    <form className="px-4" onSubmit={openAISaveHandler}>
                        <FieldGroup className="grid">
                            <Field>
                                <Label htmlFor="apikey">API Key</Label>
                                <FieldDescription>Enter your OpenAI API Key here.</FieldDescription>
                                <Input ref={apiKeyInputRef} placeholder="sk-proj..." />
                            </Field>
                            <Button type="submit" className="!w-fit">Save</Button>
                        </FieldGroup>
                    </form>
                </SheetContent>
            </Sheet>
        </Field>
    )
}

export { OpenAiIntegration }