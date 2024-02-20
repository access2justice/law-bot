import { WebClient } from "@slack/web-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function POST(req: VercelRequest, res: VercelResponse) {
  console.log(1);
  const { body } = req;
  const data = body;
  console.log(2);

  console.log(data);

  if (data.type === "url_verification") {
    return res.status(200).json({ challenge: data.challenge });
  }

  if (
    !data.event.thread_ts &&
    !data.event.parent_user_id &&
    data.event.type === "message" &&
    data.type === "event_callback" &&
    (data.event.channel === "C06GGJVRMCK" ||
      data.event.channel === "C06HA3ZLB18")
  ) {
    res.status(200).send(Date.now());

    try {
      console.log(1);
      console.log(Date.now());
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
      console.log(2);

      const json = await response.json();
      console.log(3, json);

      const payload_value = JSON.stringify({
        user_input: data.event.text,
        ai_response: json.data.content,
      });

      console.log(4);

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

      console.log(5);

      await web.chat.postMessage({
        blocks: messageBlocks,
        thread_ts: data.event.ts,
        channel: data.event.channel,
        text: json.data.content,
      });

      console.log(6);
    } catch (error) {
      console.error(error);
    }
  }
}
