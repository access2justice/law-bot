import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
import { saveExpertFeedbackToNotion } from "./notion";
import { openModal, returnSlackChallenge } from "./slack";
import queryString from "querystring";

const lambda = new AWS.Lambda();

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("EVENT:    ", event);

  let data: any;

  if (event.headers['Content-Type'] === 'application/x-www-form-urlencoded' || event.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const parsedBody = queryString.parse(event.body as string);
    data = JSON.parse(parsedBody.payload as string);
  } else {
    data = event.body ? JSON.parse(event.body) : undefined;
  }
  //testing
  // const data = event.body && JSON.parse(event.body);
  // console.log("DATA:    ", data);
  // console.log("EVENT.PATH:   ", event.path);




  try {
    if (data.type === "url_verification") {
      return returnSlackChallenge(data.challenge);
    }

    if (
      !data.event.thread_ts &&
      !data.event.parent_user_id &&
      data.event.type === "message" &&
      data.type === "event_callback" &&
      (data.event.channel === "C06GGJVRMCK" ||
        data.event.channel === "C06HA3ZLB18")
    ) {
      const params = {
        FunctionName: process.env.WORKER_FUNCTION_NAME || "",
        InvocationType: "Event",
        Payload: JSON.stringify({
          ts: data.event.ts,
          text: data.event.text,
          channel: data.event.channel,
        }),
      };

      await lambda.invoke(params).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Task offloaded successfully to the second Lambda function.",
        }),
      };
    }

    if (data.payload && data.payload.type === "block_actions") {
      const payload = data.payload;

      if (!payload.actions || payload.actions.length === 0) {
        throw new Error("No actions found in payload");
      }

      const action = payload.actions[0];

      if (action.action_id === "static_select-action") {
        return {
          statusCode: 200,
          body: "Ok",
        };
      }

      if (!action.value) {
        console.log("Action value is undefined:", action);
        throw new Error("Action value is undefined");
      }

      const payload_value = JSON.parse(action.value);
      const question =
        payload_value.user_input ||
        "Something went wrong, please copy paste the question.";
      const answer =
        payload_value.ai_response ||
        "Something went wrong, please copy paste the answer.";
      const slack_channel = payload_value.slack_channel;
      const slack_thread_ts = payload_value.slack_thread_ts;

      if (
        (payload.callback_id === "feedback" && payload.trigger_id) ||
        (action.action_id === "feedback" &&
          payload.trigger_id &&
          payload.type === "block_actions")
      ) {
        await openModal(
          payload.trigger_id,
          question,
          answer,
          slack_channel,
          slack_thread_ts
        );
      }
    } else if (data.payload && data.payload.type === "view_submission") {
      const payload = data.payload;

      console.log("payload.view.blocks:", payload.view.blocks);

      const submittedValues = payload.view.state.values;
      const selectActionKey = Object.keys(submittedValues).find(
        (key) => submittedValues[key]["static_select-action"]
      );
      const textInputKey = Object.keys(submittedValues).find(
        (key) => submittedValues[key]["plain_text_input-action"]
      );

      let correct = false;
      let comment = "";
      if (selectActionKey) {
        const staticSelectAction =
          submittedValues[selectActionKey]["static_select-action"];
        correct = staticSelectAction.selected_option.value === "correct";
      }
      if (textInputKey) {
        const textInputAction =
          submittedValues[textInputKey]["plain_text_input-action"];
        comment = textInputAction.value;
      }
      const expert = payload.user;
      const { question, answer, slack_channel, slack_thread_ts } = JSON.parse(
        payload.view.private_metadata
      );

      await saveExpertFeedbackToNotion(
        question,
        answer,
        correct,
        comment,
        expert,
        slack_channel,
        slack_thread_ts
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ response_action: "clear" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Task offloaded successfully to the second Lambda function.",
      }),
    };
  } catch (error) {
    console.error("Error invoking the second Lambda function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to offload the task to the second Lambda function.",
      }),
    };
  }
};
