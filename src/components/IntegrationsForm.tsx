import {FieldGroup} from "@/components/ui/field.tsx";
import {Dispatch, SetStateAction} from "react";
import {OpenAiIntegration} from "@/components/OpenAiIntegration.tsx";

const IntegrationsForm = ({ setAiReady }: { setAiReady: Dispatch<SetStateAction<boolean>> }) => {
    return (
        <div className="flex flex-col">
            <FieldGroup>
                <div className="flex gap-3 items-center">
                    <h2 className="scroll-m-20 text-3xl font-semibold tracking-none first:mt-0">
                        Integrations
                    </h2>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <OpenAiIntegration setAiReady={setAiReady} />
                </div>
            </FieldGroup>
        </div>
    )
}

export {IntegrationsForm};