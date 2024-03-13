"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.processEvents = exports.sendSlackMessage = void 0;
const web_api_1 = require("@slack/web-api");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const web = new web_api_1.WebClient(process.env.SLACK_TOKEN);
async function sendSlackMessage(channel, thread, text) {
    return web.chat.postMessage({
        channel: channel,
        thread_ts: thread,
        text: text,
    });
}
exports.sendSlackMessage = sendSlackMessage;
async function fetchBackendAPI(body) {
    const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return response.json();
}
async function processEvents(data) {
    console.log("2. Initiate process-events, data:" + JSON.stringify(data));
    try {
        console.log("2.1 Start message" + new Date());
        console.log("2.2. Slack message sent.", new Date());
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("2.3. Fetching backend", new Date());
        const backendResponse = await fetchBackendAPI({
            message: [
                {
                    role: "user",
                    content: data.event.text || "Explain to the user that something went wrong.",
                },
            ],
        });
        console.log("2.4. Backend response:", backendResponse);
        console.log("2.5. After fetching backend, before processing legal reasoning", new Date());
        const payload_value = JSON.stringify({
            user_input: data.event.text,
            ai_response: backendResponse.data.content,
            slack_channel: data.event.channel,
            slack_thread_ts: data.event.ts,
        });
        const legalReasoning = [];
        backendResponse.data.reasoning_thread.forEach(({ type, results, prompt }) => {
            if (type === "search") {
                legalReasoning.push({
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "⚙️ search",
                        emoji: true,
                    },
                });
                legalReasoning.push({
                    type: "context",
                    elements: results.text.map((r, i) => ({
                        type: "mrkdwn",
                        text: `*${results.art_para[i]}*: ${r}`,
                    })),
                });
                legalReasoning.push({
                    type: "divider",
                });
            }
            else if (type === "llm") {
                legalReasoning.push({
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "⚙️ llm",
                        emoji: true,
                    },
                });
                legalReasoning.push({
                    type: "context",
                    elements: prompt.map((r, i) => ({
                        type: "mrkdwn",
                        text: `*${r.role}*: ${r.content.replaceAll("\n", "")}`,
                    })),
                });
                legalReasoning.push({
                    type: "divider",
                });
            }
        });
        console.log("2.7 Processing legal reasoning and preparing message blocks.", new Date());
        const messageBlocks = [
            ...legalReasoning,
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: backendResponse.data.content,
                },
            },
            {
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "Share a feedback",
                        },
                        action_id: "feedback",
                        value: payload_value,
                    },
                ],
            },
        ];
        // console.log(messageBlocks);
        console.log("2.8 Sending final message with blocks.", new Date());
        await web.chat.postMessage({
            blocks: messageBlocks,
            thread_ts: data.event.ts,
            channel: data.event.channel,
            text: backendResponse.data.content,
        });
        console.log("2.9 Slack message sent successfully.", new Date());
    }
    catch (error) {
        console.log("Process-events Error:", error);
        console.error("Process-events Error Detailed:", JSON.stringify(error, null, 2));
    }
}
exports.processEvents = processEvents;
const handler = async (event) => {
    // The event contains the payload sent from the first Lambda function
    const data = event;
    // Here, you would add your logic to process the task details
    // For this example, let's just log the received taskDetails
    console.log("Processing task with details:", data);
    try {
        // Your task processing logic here
        // For example, interacting with a database, performing calculations, etc.
        console.log("2. Initiate process-events, data:" + JSON.stringify(data));
        try {
            console.log("2.1 Start message" + new Date());
            console.log("2.2. Slack message sent.", new Date());
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("2.3. Fetching backend", new Date());
            const backendResponse = await fetchBackendAPI({
                message: [
                    {
                        role: "user",
                        content: data.event.text ||
                            "Explain to the user that something went wrong.",
                    },
                ],
            });
            console.log("2.4. Backend response:", backendResponse);
            console.log("2.5. After fetching backend, before processing legal reasoning", new Date());
            const payload_value = JSON.stringify({
                user_input: data.event.text,
                ai_response: backendResponse.data.content,
                slack_channel: data.event.channel,
                slack_thread_ts: data.event.ts,
            });
            const legalReasoning = [];
            backendResponse.data.reasoning_thread.forEach(({ type, results, prompt }) => {
                if (type === "search") {
                    legalReasoning.push({
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "⚙️ search",
                            emoji: true,
                        },
                    });
                    legalReasoning.push({
                        type: "context",
                        elements: results.text.map((r, i) => ({
                            type: "mrkdwn",
                            text: `*${results.art_para[i]}*: ${r}`,
                        })),
                    });
                    legalReasoning.push({
                        type: "divider",
                    });
                }
                else if (type === "llm") {
                    legalReasoning.push({
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "⚙️ llm",
                            emoji: true,
                        },
                    });
                    legalReasoning.push({
                        type: "context",
                        elements: prompt.map((r, i) => ({
                            type: "mrkdwn",
                            text: `*${r.role}*: ${r.content.replaceAll("\n", "")}`,
                        })),
                    });
                    legalReasoning.push({
                        type: "divider",
                    });
                }
            });
            console.log("2.7 Processing legal reasoning and preparing message blocks.", new Date());
            const messageBlocks = [
                ...legalReasoning,
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: backendResponse.data.content,
                    },
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "Share a feedback",
                            },
                            action_id: "feedback",
                            value: payload_value,
                        },
                    ],
                },
            ];
            // console.log(messageBlocks);
            console.log("2.8 Sending final message with blocks.", new Date());
            await web.chat.postMessage({
                blocks: messageBlocks,
                thread_ts: data.event.ts,
                channel: data.event.channel,
                text: backendResponse.data.content,
            });
            console.log("2.9 Slack message sent successfully.", new Date());
        }
        catch (error) {
            console.log("Process-events Error:", error);
            console.error("Process-events Error Detailed:", JSON.stringify(error, null, 2));
        }
        // Log or return a result (as needed)
        console.log("Task processed successfully");
        // Returning a response (optional)
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Task processed successfully",
            }),
        };
    }
    catch (error) {
        console.error("Error processing task:", error);
        // Handling errors (optional)
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Error processing the task",
            }),
        };
    }
};
exports.handler = handler;
