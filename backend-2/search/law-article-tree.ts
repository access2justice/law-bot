import { SearchResult } from "@azure/search-documents";
import { llmQuery, semanticSearch } from "../azure";

interface LawArticleNode {
  name: string;
  validation?: boolean;
  articles?: {
    content: string;
    code: string;
    validation?: boolean;
  }[];
  children?: LawArticleNode[];
}

export default class LawArticleTree {
  private tree: LawArticleNode[];
  private query: string;
  private validationQueries: any[];

  constructor(queryString: string) {
    this.tree = [];
    this.query = queryString;
    this.validationQueries = [];
  }

  public search = async () => {
    const results = await semanticSearch(this.query);

    const articleList = [] as SearchResult<
      object,
      "text" | "metadata" | "eIds"
    >[];
    for await (let result of results) {
      const metadata = (result.document as any)["metadata"] as string[];
      const lawArticleContent = (result.document as any)["text"] as string;
      const titles = metadata.slice(1, -1);
      const lawArticleCode = metadata[metadata.length - 1];
      articleList.push(result);
      this.insertResult(titles, lawArticleCode, lawArticleContent);
    }
    console.log("Received " + articleList.length + " results.");
  };

  public getTree = () => {
    return this.tree;
  };

  private insertResult = (
    orderedTitles: string[],
    articleCode: string,
    articleContent: string
  ) => {
    let currentTitle = orderedTitles[0];
    let titlesRemaining = orderedTitles.slice(1);

    let treeHit = this.tree.find((node) => node.name === currentTitle);
    let lastTreeHit: LawArticleNode | undefined;

    while (treeHit && titlesRemaining.length > 1) {
      lastTreeHit = treeHit;
      currentTitle = titlesRemaining[0];
      titlesRemaining = titlesRemaining.slice(1);
      treeHit = treeHit.children?.find((node) => node.name === currentTitle);
    }

    if (treeHit && titlesRemaining.length === 0) {
      treeHit.articles = [
        ...(treeHit.articles || []),
        {
          content: articleContent,
          code: articleCode,
        },
      ];
    } else if (!treeHit && titlesRemaining.length > 0) {
      if (!lastTreeHit) {
        this.tree.push(
          this.buildSubTree(orderedTitles, articleCode, articleContent)
        );
      } else {
        lastTreeHit.children?.push(
          this.buildSubTree(
            [currentTitle, ...titlesRemaining],
            articleCode,
            articleContent
          )
        );
      }
    }
  };

  private buildSubTree = (
    orderedTitles: string[],
    articleCode: string,
    articleContent: string
  ): LawArticleNode => {
    let currentTitle = orderedTitles[0];
    if (orderedTitles.length === 1) {
      return {
        name: currentTitle,
        articles: [
          {
            content: articleContent,
            code: articleCode,
          },
        ],
      };
    } else {
      let remainderTitles = orderedTitles.slice(1);

      return {
        name: orderedTitles[0],
        children: [
          this.buildSubTree(remainderTitles, articleCode, articleContent),
        ],
      };
    }
  };

  public printTree = () => {
    // console.log(JSON.stringify(this.tree, undefined, "  "));
    return JSON.stringify(this.tree, undefined, "  ");
  };

  public validateArticles = async () => {
    console.log("Build validation");
    this.tree.forEach((node) => this.buildNodeValidation(node));
    console.log("Start validation");
    await Promise.all(this.validationQueries);
    console.log("Finished validation");
  };

  private buildNodeValidation = (subTree: LawArticleNode) => {
    subTree.articles?.forEach((a) => {
      this.validationQueries.push(
        llmQuery([
          {
            role: "system",
            content: `For any legal question or statement given by the user, you need to evaluate if the following law article of Swiss law is relevant:\n\n${a.content}\n\nAnswer this question by merely returning the words, TRUE or FALSE. Do not add any further explanation.`,
          },
          {
            role: "user",
            content: this.query,
          },
        ]).then((validation) => {
          console.log(`Validated ${a.code}`);
          if (validation.toLowerCase() === "true") a.validation = true;
          if (validation.toLowerCase() === "false") a.validation = false;
        })
      );
    });
    subTree.children?.forEach((c) => this.buildNodeValidation(c));
  };

  private inflateTree = async () => {};
}
