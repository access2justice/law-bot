import { APIGatewayProxyHandler } from "aws-lambda";
import { getReasoning } from "./repository";
import { doReasoning } from "./reasoning";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authenticationKey =
      event.headers["Authorization"]?.replace("Bearer ", "") ||
      event.headers["authorization"]?.replace("Bearer ", "");

    if (authenticationKey !== process.env.AUTHENTICATION_KEY) {
      throw new Error("Unauthenticated!");
    }

    console.log(event.body);
    console.log(JSON.parse(event.body || "{}"));

    const message = JSON.parse(event.body || "{}").message as {
      role: string;
      content: string;
    }[];

    let baseQuery = message[0].content;

    console.log("Get the reasoning.");
    const reasoning = await getReasoning();
    console.log("Got the reasoning.");

    console.log("Do the reasoning.");
    const { reasoningThread, content } = await doReasoning(
      baseQuery,
      reasoning
    );
    console.log("Did the reasoning.");

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: {
          content: content,
          reasoning_thread: reasoningThread,
        },
      }),
    };
  } catch (error) {
    console.error("An error took place:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `An error took place. ${error}`,
      }),
    };
  }
};
