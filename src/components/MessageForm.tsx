import {SubmitEventHandler, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Field, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {messageAi} from "@/lib/backend.ts";

const MessageForm = ({ isAiReady }: { isAiReady: boolean }) => {
    const [isSending, setIsSending] = useState(false);
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("")

    const messageSendHandler: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setIsSending(true);

        const success = await messageAi(`${username} asked ${message}`)
        if (success) {
            setIsSending(false);
        }
    }

    return (
        <form onSubmit={messageSendHandler} className="w-full h-fit">
            <FieldGroup>
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
                    Message
                </h1>
                <Field>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="olliethefoxxo" type="text" disabled={isSending || !isAiReady} onChange={(e) => setUsername(e.target.value)} value={username} />
                </Field>
                <Field>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" className="max-h-40" placeholder="Ahoy there! How are..." disabled={isSending || !isAiReady} onChange={(e) => setMessage(e.target.value)} value={message} />
                </Field>
                <Field orientation="horizontal">
                    <Button disabled={isSending || !isAiReady}>Send</Button>
                </Field>
            </FieldGroup>
        </form>
    )
}

export { MessageForm };