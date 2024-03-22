import { Handler } from "aws-lambda";
import { sendSlackMessage } from "./slack";

async function fetchBackendAPI(body: any) {
  const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT || "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

export const handler: Handler = async (event) => {
  // The event contains the payload sent from the first Lambda function
  const data = event;

  // Here, you would add your logic to process the task details
  // For this example, let's just log the received taskDetails
  console.log("Processing task with details:", data);

  try {
    // Your task processing logic here
    // For example, interacting with a database, performing calculations, etc.
    console.log("2. Initiate process-events, data:" + JSON.stringify(data));
    console.log("2.1 Start message" + new Date());
    await sendSlackMessage(
      data.channel,
      data.ts,
      "Yummy, a legal question! Let me take a look ..."
    );
    console.log("2.2. Slack message sent.", new Date());
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("2.3. Fetching backend", new Date());
    const backendResponse = await fetchBackendAPI({
      message: [
        {
          role: "user",
          content:
            data.text || "Explain to the user that something went wrong.",
        },
      ],
    });
    console.log("2.4. Backend response:", backendResponse);

    if (backendResponse.message === "Endpoint request timed out") {
      throw new Error("Request timed out");
    }

    console.log(
      "2.5. After fetching backend, before processing legal reasoning",
      new Date()
    );

    const legalReasoning = [] as any[];
    backendResponse.data.reasoning_thread.forEach(
      ({ type, results, prompt }: any) => {
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
            elements: results.text.map((r: string, i: number) => ({
              type: "mrkdwn",
              text: `<${results.metadata[i][0]}|${results.metadata[i][8]}>`,
            })),
          });
          legalReasoning.push({
            type: "divider",
          });
        } else if (type === "llm") {
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
            elements: prompt.map((r: any, i: number) => ({
              type: "mrkdwn",
              text: `*${r.role}*: ${r.content.replaceAll("\n", "")}`,
            })),
          });
          legalReasoning.push({
            type: "divider",
          });
        }
      }
    );

    const payload_value = JSON.stringify({
      user_input: data.text,
      ai_response: backendResponse.data.content,
      slack_channel: data.channel,
      slack_thread_ts: data.ts,
    });

    console.log(
      "2.7 Processing legal reasoning and preparing message blocks.",
      new Date()
    );
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

    await sendSlackMessage(
      data.channel,
      data.ts,
      "Yummy, a legal question! Let me take a look ...",
      messageBlocks
    );
    console.log("2.9 Slack message sent successfully.", new Date());

    // Log or return a result (as needed)
    console.log("Task processed successfully");

    // Returning a response (optional)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Task processed successfully",
      }),
    };
  } catch (error) {
    console.error("Error processing task:", error);

    await sendSlackMessage(
      data.channel,
      data.ts,
      `Unfortunately something went wrong ... ${error}`
    );

    // Handling errors (optional)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Error processing the task ${error}`,
      }),
    };
  }
};
