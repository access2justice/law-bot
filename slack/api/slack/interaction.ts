import { WebClient } from "@slack/web-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function POST(req: VercelRequest, res: VercelResponse) {
  const { body } = req;
  const data = body;
  console.log(data);
  const payload = JSON.parse(data["payload"] as string);
  console.log(payload);
  const action = payload.actions[0];
  console.log(action);

  if (
    (payload.callback_id === "feedback" && payload.trigger_id) ||
    (action.action_id === "feedback" &&
      payload.trigger_id &&
      payload.type === "block_actions")
  ) {
    // get rid of this
    const thread = await web.conversations.replies({
      channel: payload.channel.id,
      ts: payload.message.ts,
    });

    const payload_value = JSON.parse(action.value);
    const question =
      payload_value.user_input ||
      "Something went wrong, please copy paste the question.";
    const answer =
      payload_value.ai_response ||
      "Something went wrong, please copy paste the answer.";

    await openModal(payload.trigger_id, question, answer);
  }

  if (payload.type === "view_submission") {
    console.log(JSON.stringify(payload.view.blocks));

    /// submit to Notion

    return res.status(200).json({ response_action: "clear" });
  }

  return res.status(200).send("Ok");
}

const openModal = async (trigger: string, question: string, answer: string) => {
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
};
