import {Field, FieldDescription, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList
} from "@/components/ui/combobox"
import {Status} from "@/components/Status.tsx";

const aiModels = [
    "gpt-4o"
]



const ConfigForm = ({ userConfig, setUserConfig, apiKey, setApiKey, formHandler, isLoading, isOnline }: { userConfig: any, setUserConfig: any, apiKey: string, setApiKey: any, formHandler: any, isLoading: any, isOnline: any }) => {
    const updateConfig = (data: any) => {
        const newConfig = {...userConfig, ...data};
        setUserConfig(newConfig);
    }

    return (
        <form onSubmit={(event) => formHandler(event, apiKey, setApiKey)}>
            <FieldGroup>
                <div className="flex gap-3 items-center">
                    <Status state={isOnline} />
                    <h2 className="scroll-m-20 text-3xl font-semibold tracking-none first:mt-0">
                        AI Companion
                    </h2>
                </div>
                <FieldGroup className="grid md:grid-cols-2">
                    <Field>
                        <Label htmlFor="aimodel">AI Model</Label>
                        <FieldDescription>Choose which AI Model you want to use.</FieldDescription>
                        <Combobox id="aimodel" value="gpt-4o" items={aiModels}>
                            <ComboboxInput disabled placeholder="Select an AI Model" />
                            <ComboboxContent>
                                <ComboboxEmpty>No items found.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </Field>
                    <Field>
                        <Label htmlFor="apikey" className="mb-1">API Key</Label>
                        <FieldDescription>Enter your API Key here.</FieldDescription>
                        <Input id="apikey" type="password" placeholder="sk-proj..." disabled={isLoading} onChange={(e) => setApiKey(e.target.value)} value={apiKey} />
                    </Field>
                </FieldGroup>
                <Field>
                    <Label htmlFor="aicontext">AI Context</Label>
                    <FieldDescription>Describe how you want your companion will behave!</FieldDescription>
                    <Textarea id="aicontext" className="max-h-40" placeholder="You are a..."
                              disabled={isLoading} onChange={(e) => updateConfig({context: e.target.value})}
                              value={userConfig.context ?? ""}/>
                </Field>
                <Field orientation="horizontal">
                    <Button disabled={isLoading}>Save</Button>
                </Field>
            </FieldGroup>
        </form>
    )
}

export { ConfigForm }