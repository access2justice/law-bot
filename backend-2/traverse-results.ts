import { SearchIterator, SearchResult } from "@azure/search-documents";
import { filterMetadata, semanticSearch } from "./azure";

export const testTraverseResults = async () => {
  // 269d OR
  const question =
    "Mein Vermieter hat mir per Einschreiben einen Brief gesendet, in welchem er schreibt, er werde auf den nächsten Kündigungstermin eine Mietzinserhöhung vornehmen. Ist diese Erhöhung gültig?";

  const results1 = await filterMetadata("Achter Titel:   Die Miete");

  const articleList = [] as SearchResult<
    object,
    "text" | "metadata" | "eIds"
  >[];
  for await (let result of results1) {
    // console.log("results1");
    // console.log(result.document);
    // process.stdout.write(".");
    articleList.push(result);
  }

  const results = await traverseResults(question, articleList);
  // console.log(results);
};

export const traverseResults = async (
  question: string,
  articles: SearchResult<object, "text" | "metadata" | "eIds">[]
): Promise<SearchResult<object, "text" | "metadata" | "eIds">[]> => {
  const tree = {} as Record<string, object>;
  for (let article of articles) {
    const content = ((article.document as any)["metadata"] as any[]).slice(
      1,
      -1
    );
    console.log(content);

    let subtree = tree as any;
    for (let node of content) {
      subtree[node] = subtree[node] || {};
      subtree = subtree[node];
    }
  }
  console.log(JSON.stringify(tree, undefined, 2));
  return articles;
};
