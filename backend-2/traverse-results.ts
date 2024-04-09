import { SearchIterator } from "@azure/search-documents";
import { filterMetadata, semanticSearch } from "./azure";

export const testTraverseResults = async () => {
  const results1 = await filterMetadata("Achter Titel:   Die Miete");
  // const results1 = await semanticSearch("Achter Titel:  Die Miete");

  for await (let result of results1) {
    // console.log("results1");
    // console.log(result);
    process.stdout.write(".");
  }

  return;

  // const results = await traverseResults();
  // console.log(results);
};

export const traverseResults = async (
  messages: SearchIterator<object, "text" | "metadata" | "eIds">
): Promise<SearchIterator<object, "text" | "metadata" | "eIds">> => {
  return "" as any;
};
