import { WebClient } from "@slack/web-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { body } = req;
  const data = body;

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT || "", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: [
          {
            role: "user",
            content:
              data.event.text ||
              "Explain to the user that something went wrong.",
          },
        ],
      }),
    });

    const json = await response.json();

    const payload_value = JSON.stringify({
      user_input: data.event.text,
      ai_response: json.data.content,
      slack_channel: data.event.channel,
      slack_thread_ts: data.event.ts,
    });

    const messageBlocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: json.data.content,
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

    await web.chat.postMessage({
      blocks: messageBlocks,
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: json.data.content,
    });
  } catch (error) {
    console.error("Error fetching Backend:", error);
  }
}
