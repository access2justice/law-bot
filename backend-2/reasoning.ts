import { ReasoningInterface } from "./repository";
import { AzureKeyCredential, SearchClient } from "@azure/search-documents";
import { ChatRequestMessage, OpenAIClient } from "@azure/openai";

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

export const doReasoning = async (
  baseQuery: string,
  reasoning: ReasoningInterface[]
) => {
  const reasoningThread = [] as any[];

  const messages0 = [
    {
      role: "system",
      content:
        "You are a legal lawyer and we are going step by step. For the first step you get a question from a user and list of books of law in switzerland. Identify the relevant law book most likely to contain the answer to the user's question. Select the most specific book possible. Answer only with the exact name of the law book as you received it. Books of law: {{tols}}",
    },
    {
      role: "user",
      content: "Question from the user:{{baseQuery}}",
    },
  ];

  const tols = await Bun.file("../data/tols/tols.txt")
    .text()
    .then((t) => t.split("\n"));

  for (let message of messages0) {
    message.content = message.content.replace("{{baseQuery}}", baseQuery);
    message.content = message.content.replace("{{tols}}", tols.join("\n"));
  }
  const completion0 = await openAIClient.getChatCompletions(
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
    messages0 as ChatRequestMessage[],
    {
      temperature: 0.0,
      maxTokens: 300,
    }
  );
  console.log("Received LLM Result0");
  console.log(JSON.stringify(completion0));
  const completionResult0 = completion0.choices[0].message?.content as string;
  reasoningThread.push({
    type: "llm",
    prompt: messages0,
    response: completionResult0,
  });

  if (!tols.includes(completionResult0)) {
    console.log("LLM did not return a valid book of law");
    return { reasoningThread, content: {} };
  } else {
    console.log("LLM returned a valid book of law: " + completionResult0);
  }

  const toc = await Bun.file(
    `../data/tols/toc/${completionResult0}.txt`
  ).text();

  const messages1 = [
    {
      role: "system",
      content:
        "Now you have the relevant law book. For the second step, you get a question from a user and a table of contents of the law book. Identify the relevant articles likely to contain the answer to the user's question. Better select more than less articles. Answer only with the exact name of the articles ['Art. XX', 'Art. XX', ...] as you received it. Table of contents:\n{{toc}}",
    },
    {
      role: "user",
      content: "Question from the user:{{baseQuery}}",
    },
  ];

  for (let message of messages1) {
    message.content = message.content.replace("{{baseQuery}}", baseQuery);
    message.content = message.content.replace("{{toc}}", toc);
  }
  console.log("Infering...");
  const completion1 = await openAIClient.getChatCompletions(
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
    messages1 as ChatRequestMessage[],
    {
      temperature: 0.0,
      maxTokens: 300,
    }
  );
  console.log("Received LLM Result1");
  console.log(JSON.stringify(completion1));
  const completionResult1 = completion1.choices[0].message?.content as string;
  reasoningThread.push({
    type: "llm",
    prompt: messages1,
    response: completionResult1,
  });

  // full text search for the response
  const searchResults = await searchClient.search(completionResult1, {
    filter: `metadata/any(t: search.in(t, '${completionResult0}', '|'))`,
    select: ["text", "metadata", "eIds"],
    top: 20,
  });
  const retrievedInfo = {
    eIds: [] as string[][],
    text: [] as string[][],
    metadata: [] as string[][],
  };
  for await (let result of searchResults.results) {
    retrievedInfo.eIds.push((result.document as any).eIds);
    retrievedInfo.text.push((result.document as any).text);
    retrievedInfo.metadata.push((result.document as any).metadata);
  }
  const searchResultText = retrievedInfo.text.reduce(
    (p: any, c: any) => p + `\n\n` + c,
    ""
  );
  reasoningThread.push({
    type: "search",
    query: completionResult1,
    results: retrievedInfo,
  });

  const messages2 = [
    {
      role: "system",
      content:
        "Finally, You are a Swiss legal expert. Please only answer questions to which Swiss law is applicable, for any other question, just say 'Your question is out of scope.' Use only the provisions of Swiss law provided in the Swiss law retrieval result to answer the user question. You should only use the Swiss law retrieval result for your answer. Your answer must be based on the Swiss law retrieval result. Don't try to make up an answer if it is not fully clear from the Swiss law retrieval result. Explain your answer and refer the exact source / article of the Swiss law retrieval result sentence by sentence taking into account the five articles preceding the article identified in the numeric order.",
    },
    {
      role: "user",
      content:
        "{{baseQuery}}\n\nSwiss law retrieval result:\n{{previousQuery}}",
    },
  ];

  for (let message of messages2) {
    message.content = message.content.replace("{{baseQuery}}", baseQuery);
    message.content = message.content.replace(
      "{{previousQuery}}",
      searchResultText
    );
  }
  const completion2 = await openAIClient.getChatCompletions(
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
    messages2 as ChatRequestMessage[],
    {
      temperature: 0.0,
      maxTokens: 350,
    }
  );
  console.log("Received LLM Result2");
  console.log(JSON.stringify(completion2));
  const completionResult2 = completion2.choices[0].message?.content as string;
  reasoningThread.push({
    type: "llm",
    prompt: messages2,
    response: completionResult2,
  });

  return { reasoningThread, content: {} };
};
