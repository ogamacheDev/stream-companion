import {useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {Field, FieldGroup} from "@/components/ui/field.tsx";
import {Label} from "@/components/ui/label.tsx";
import {toast} from "sonner";
import {client} from "@/lib/backend.ts";

const MessageForm = ({ isAiReady }: { isAiReady: any }) => {
    const [isSending, setIsSending] = useState(false);
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("")

    const messageFormHandler = async (event: any) => {
        event.preventDefault();
        setIsSending(true);
        toast.promise(() => new Promise(async (resolve, reject) => {
            client.emit("ai:message", {
                type: "event",
                user: username,
                message: message
            }, (res: any) => {
                setIsSending(false);
                console.log(res)
                if (res.success) {
                    resolve(res.message);
                    return;
                }
                reject();
            })
        }), {
            loading: "Sending...",
            success: "Message Sent!",
            error: "Error",
        })
    }

    return (
        <form onSubmit={messageFormHandler} className="w-full h-fit">
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