import { WebClient } from "@slack/web-api";
import * as dotenv from "dotenv";

dotenv.config();

const web = new WebClient(process.env.SLACK_TOKEN);

export async function sendSlackMessage(
  message: string,
  slack_channel: string,
  slack_thread_ts: string
) {
  await web.chat.postMessage({
    channel: slack_channel,
    text: message,
    thread_ts: slack_thread_ts,
  });
}

export function returnSlackChallenge(challenge: string) {
  return {
    statusCode: 200,
    body: JSON.stringify({ challenge }),
  };
}

export const openModal = async (
  trigger: string,
  question: string,
  answer: string,
  slack_channel: string,
  slack_thread_ts: string
) => {
  try {
    const result = await web.views.open({
      trigger_id: trigger,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "Law Bot Expert Feedback",
          emoji: true,
        },
        submit: {
          type: "plain_text",
          text: "Submit",
          emoji: true,
        },
        close: {
          type: "plain_text",
          text: "Cancel",
          emoji: true,
        },
        private_metadata: JSON.stringify({
          question,
          answer,
          slack_channel,
          slack_thread_ts,
        }),
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Was the answer correct?",
            },
            accessory: {
              type: "static_select",
              placeholder: {
                type: "plain_text",
                text: "Select an item",
                emoji: true,
              },
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "Yes",
                    emoji: true,
                  },
                  value: "correct",
                },
                {
                  text: {
                    type: "plain_text",
                    text: "No",
                    emoji: true,
                  },
                  value: "false",
                },
              ],
              action_id: "static_select-action",
            },
          },
          {
            type: "input",
            element: {
              type: "plain_text_input",
              multiline: true,
              action_id: "plain_text_input-action",
            },
            label: {
              type: "plain_text",
              text: "Your Expert Comment",
              emoji: true,
            },
          },
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Question & Bot's Answer",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: question,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "plain_text",
                text: answer,
                emoji: true,
              },
            ],
          },
        ],
      },
    });

    // The result contains an identifier for the root view, view.id
    console.log(`Successfully opened root view ${result.view?.id}`);
  } catch (error) {
    console.error("Error opening modal:", error);
    throw error;
  }
};
