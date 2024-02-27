import { WebClient } from "@slack/web-api";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function POST(req: VercelRequest, res: VercelResponse) {
  const { body } = req;
  const data = body;
  console.log("data:", data);

  try {
    if (!data.payload) {
      throw new Error("Payload is missing");
    }
    const payload = JSON.parse(data.payload);
    console.log("payload:", payload);

    if (payload.type === "block_actions") {
      if (!payload.actions || payload.actions.length === 0) {
        throw new Error("No actions found in payload");
      }

      const action = payload.actions[0];
      console.log("actions:", action);

      if (!action.value) {
        throw new Error("Action value is undefined");
      }

      const payload_value = JSON.parse(action.value);
      const question =
        payload_value.user_input ||
        "Something went wrong, please copy paste the question.";
      const answer =
        payload_value.ai_response ||
        "Something went wrong, please copy paste the answer.";

      if (
        (payload.callback_id === "feedback" && payload.trigger_id) ||
        (action.action_id === "feedback" &&
          payload.trigger_id &&
          payload.type === "block_actions")
      ) {
        await openModal(payload.trigger_id, question, answer);
      }
    } else if (payload.type === "view_submission") {
      console.log(JSON.stringify(payload.view.blocks));

      const submittedValues = payload.view.state.values;
      console.log("submittedValues:", submittedValues);
      const correct =
        submittedValues["v/ZLi"]["static_select-action"]["selected_option"][
          "value"
        ] === "correct";
      const comment = submittedValues["plain_text_input-action"]["value"];
      const expertId = "";
      const { user_input, ai_response } = JSON.parse(payload.actions[0].value);

      await submitToNotion(user_input, ai_response, correct, comment, expertId);

      return res.status(200).json({ response_action: "clear" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(400).send("Bad Request");
  }

  return res.status(200).send("Ok");
}

const openModal = async (trigger: string, question: string, answer: string) => {
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
    throw error; // Ensure this error is caught or logged appropriately.
  }
};

async function submitToNotion(
  question: string,
  answer: string,
  correct: boolean,
  comment: string,
  expertId: string
) {
  try {
    const response = await fetch(
      `https://${process.env.VERCEL_URL}/api/slack/notion-interaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
          correct,
          comment,
          expertId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit to Notion");
    }

    console.log("Submitted to Notion successfully");
  } catch (error) {
    console.error("Error submitting to Notion:", error);
    throw error;
  }
}
