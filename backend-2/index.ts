import { AzureKeyCredential, SearchClient } from "@azure/search-documents";
import { ChatRequestMessage, OpenAIClient } from "@azure/openai";
import { APIGatewayProxyHandler } from "aws-lambda";
import { getReasoning } from "./repository";
import { doReasoning } from "./reasoning";

const openAIClient = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT || "",
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY || "")
);

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENPOINT || "",
  process.env.AZURE_SEARCH_INDEX_NAME || "",
  new AzureKeyCredential(process.env.AZURE_SEARCH_KEY || "")
);

const getEmbeddings = async (query: string) => {
  return await openAIClient.getEmbeddings(
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "",
    [query]
  );
};

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
    console.error("Error invoking the second Lambda function:", error);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Failed to offload the task to the second Lambda function. ${error}`,
      }),
    };
  }
};
