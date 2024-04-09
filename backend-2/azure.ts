import {
  AzureKeyCredential,
  SearchClient,
  SearchIterator,
} from "@azure/search-documents";
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

export const llmQuery = async (
  messages: ChatRequestMessage[]
): Promise<string> => {
  // console.log("Doing a chat completion: " + JSON.stringify(messages));

  const temperature = 0;
  const completion = await openAIClient.getChatCompletions(
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
    messages,
    {
      temperature,
      maxTokens: 300,
      requestOptions: {
        timeout: 10000,
      },
    }
  );
  const completionResult = completion.choices[0].message?.content as string;

  // console.log("Received a chat completion: " + completionResult);

  return completionResult;
};

export const semanticSearch = async (
  query: string
): Promise<SearchIterator<object, "text" | "metadata" | "eIds">> => {
  const x = await searchClient.search(query, {
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
    top: 15,
    queryType: "semantic",
    semanticSearchOptions: {
      configurationName: "SemanticConfTest",
      captions: {
        captionType: "extractive",
      },
    },
    includeTotalCount: true,
    select: ["text", "metadata", "eIds"],
  });
  return x.results;
};

export const filterMetadata = async (
  query: string
): Promise<SearchIterator<object, "text" | "metadata" | "eIds">> => {
  const x = await searchClient.search("*", {
    filter: `metadata/any(t: search.in(t, '${query}', '|'))`,
    select: ["text", "metadata", "eIds"],
  });
  return x.results;
};
