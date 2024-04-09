import { SearchResult } from "@azure/search-documents";

interface LawCodeNode {
  name: string;
  validation?: boolean;
  articles?: SearchResult<object, "text" | "metadata" | "eIds">[];
  children: LawCodeNode;
}

class LawCodeTree {
  private tree?: LawCodeNode;

  constructor() {
    this.tree = undefined;
  }

  public getTree = () => {
    return this.tree;
  };

  public addNode = () => {};

  public initializeTree = () => {};
}
