import { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";

// Initialize the Lambda client
const lambda = new AWS.Lambda();

export const handler: APIGatewayProxyHandler = async (event) => {
  // Parse the request body
  const data = event.body && JSON.parse(event.body);
  console.log(data);
  console.log(event.path);

  try {
    if (data.type === "url_verification") {
      return {
        statusCode: 200,
        body: JSON.stringify({ challenge: data.challenge }),
      };
    }

    if (
      !data.event.thread_ts &&
      !data.event.parent_user_id &&
      data.event.type === "message" &&
      data.type === "event_callback" &&
      (data.event.channel === "C06GGJVRMCK" ||
        data.event.channel === "C06HA3ZLB18")
    ) {
      // Setup parameters to invoke the second Lambda function
      const params = {
        FunctionName: process.env.WORKER_FUNCTION_NAME || "", // Specify the second Lambda function name
        InvocationType: "Event", // Use 'Event' for asynchronous execution
        Payload: JSON.stringify({}),
      };

      await lambda.invoke(params).promise();

      // Return a successful response
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Task offloaded successfully to the second Lambda function.",
        }),
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
