import {ChatOpenAI} from "@langchain/openai"
import {MemorySaver} from "@langchain/langgraph";
import {createAgent} from "langchain";
import type {ReactAgent} from "langchain";

let agent: ReactAgent | null = null;
let agentRunning: boolean = false;

const instructions = `
You are a friendly text only Twitch Stream AI Companion. Only respond in text messages.
            
# Type of messages:
## System
- Provides either context or twitch messages.
- You will keep the information of those messages for future reference and behaviors.
- You will only respond to those messages with OK.

## Events
- Provides information of an event such as a twitch follow, sub, donation, bits, redeem or more.
- You will keep the information of those messages for future reference and behaviors.
- When it is a stream event such as a Follow, Sub, Gifted Sub, Bits, you must mention the name of the person, and then comment on it.

## STT
- Provides the message recorded by the streamer.
- You will keep the information of those messages for future reference and behaviors.
`;

const getAiState = () => {
    return agentRunning;
}

const startAI = async (config: any) => {
    const checkpointer = new MemorySaver();

    const model = new ChatOpenAI({
        model: "gpt-4o",
        temperature: 0,
        apiKey: config.apiKey,
    })
    agent = createAgent({
        model: model,
        checkpointer
    })

    try {
        const response = await agent.invoke(
            {
                messages: [
                    {
                        role: "system",
                        content: instructions
                    },
                    {
                        role: "user",
                        content: config.message
                    }
                ]
            },
            {
                configurable: {
                    thread_id: "1"
                }
            }
        )

        const success = response.messages[response.messages.length-1].content == "OK"
        if (success) {
            agentRunning = true;
            console.log("Socket.io: AI Started Successfully")
        } else {
            agentRunning = false;
            console.log("Socket.io: Failed Starting AI")
        }

        return {
            success: success,
            messages: response.messages
        }
    } catch (error) {
        console.log("Socket.io: Failed Starting AI")

        return {
            success: false,
            messages: error
        }
    }
}

const messageAi = async (message: string) => {
    if (!agent) {
        return {
            success: false,
            message: "AI Companion not initiated"
        };
    }

    try {
        const response = await agent.invoke(
            {
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            },
            {
                configurable: {
                    thread_id: "1"
                }
            }
        )

        return {
            success: true,
            message: response.messages[response.messages.length-1].content
        }
    } catch (error) {
        agentRunning = false;

        return {
            success: false,
            message: error
        }
    }
}

export { startAI, messageAi, getAiState }