import { SearchIterator, SearchResult } from "@azure/search-documents";
import { filterMetadata, semanticSearch } from "../azure";
import { Queue } from "../Queue";

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
    articleList.push(result);
  }

  const dataTree = await createTree(articleList);
  console.log(JSON.stringify(dataTree, undefined, 2));
  const results = await traverseResults(question, dataTree);
};

export const createTree = async (
  articles: SearchResult<object, "text" | "metadata" | "eIds">[]
): Promise<Record<string, object>> => {
  const tree = {} as Record<string, object>;
  for (let article of articles) {
    const content = ((article.document as any)["metadata"] as any[]).slice(
      1,
      -1
    );

    let subtree = tree as any;
    for (let node of content) {
      subtree[node] = subtree[node] || {};
      subtree = subtree[node];
    }
  }
  return tree;
};

interface TreeNode {
  [key: string]: TreeNode; // String index signature
}

export const traverseResults = async (
  question: string,
  dataTree: Record<string, object>
): Promise<SearchResult<object, "text" | "metadata" | "eIds">[]> => {
  const results = [] as string[];
  const queue = new Queue<TreeNode>();

  // Enqueue the root node
  queue.enqueue(dataTree as TreeNode);

  // Perform BFS
  while (!queue.isEmpty()) {
    const currentNode = queue.dequeue()!;

    if (Object.keys(currentNode).length === 1) {
      queue.enqueue(currentNode[Object.keys(currentNode)[0]]);
    } else {
      //ask chatgpt if node contains relevent data for question
      let resultFromChatGPT;

      //if yes, add to results
      if (resultFromChatGPT == true) {
        results.push(currentNode);
        //if current node has children, add them to the queue
        if (Object.keys(currentNode).length > 0) {
          for (const key in currentNode) {
            queue.enqueue(currentNode[key]);
          }
        }
      } else {
        //if no, continue traversing
        continue;
      }
    }
  }

  return results;
};
