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
  let previousQuery = baseQuery;
  const reasoningThread = [] as any[];

  for (let reason of reasoning) {
    if (reason.type === "llm") {
      console.log("LLM Stage");
      console.log(JSON.stringify(reason));

      const messages = reason.llmQuery?.messages.map((m: any) => {
        console.log("This is ", m);
        let prompt = m.prompt || "";
        prompt = prompt.replace("{{baseQuery}}", baseQuery);
        prompt = prompt.replace("{{previousQuery}}", previousQuery);
        console.log("That is ", prompt);

        return Object.assign({}, m, { prompt });
      }) as unknown as ChatRequestMessage[];

      const temperature = 0.0;

      console.log("Rendered Query");
      console.log(JSON.stringify(messages));

      const completion = await openAIClient.getChatCompletions(
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
        messages,
        {
          temperature,
          maxTokens: 300,
        }
      );

      console.log("Received LLM Result");
      console.log(JSON.stringify(completion));

      const completionResult = completion.choices[0].message?.content as string;

      previousQuery = completionResult;

      reasoningThread.push({
        type: "llm",
        prompt: messages,
        response: completionResult,
      });
    } else if (reason.type === "search") {
      console.log("SEARCH Stage");
      console.log(JSON.stringify(reason));

      let query = reason.searchQuery?.query || "";

      query = query.replace("{{baseQuery}}", baseQuery);
      query = query.replace("{{previousQuery}}", baseQuery);

      console.log("Rendered Query");
      console.log(JSON.stringify(query));

      const results = await searchClient.search(query, {
        vectorSearchOptions: {
          queries: [
            {
              fields: ["text_vector"],
              kNearestNeighborsCount: 3,
              vector: (await getEmbeddings(query)).data[0].embedding,
              kind: "vector",
            },
          ],
        },
        top: 5,
        includeTotalCount: true,
        select: ["text", "metadata", "eIds"],
      });

      console.log("Received Search Results");
      console.log(JSON.stringify(results));

      const retrievedInfo = {
        eIds: [] as string[][],
        text: [] as string[][],
        metadata: [] as string[][],
      };

      for await (let result of results.results) {
        retrievedInfo.eIds.push((result.document as any).eIds);
        retrievedInfo.text.push((result.document as any).text);
        retrievedInfo.metadata.push((result.document as any).metadata);
      }

      previousQuery = retrievedInfo.text.reduce(
        (p: any, c: any) => p + `\n\n` + c,
        ""
      );

      reasoningThread.push({
        type: "search",
        query: previousQuery,
        results: retrievedInfo,
      });
    }
  }

  return { reasoningThread, content: previousQuery };
};
