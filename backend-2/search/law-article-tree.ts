import { SearchResult } from "@azure/search-documents";
import {
  filterMetadata,
  filterMetadataArray,
  llmQuery,
  semanticSearch,
} from "../azure";
import { withTimeout } from "../utils";

interface LawArticle {
  content: string;
  code: string;
  validation?: boolean;
  mechanism: "semantic" | "inflation";
}

interface LawArticleNode {
  name: string;
  validation?: boolean;
  articles?: LawArticle[];
  children?: LawArticleNode[];
  parent?: LawArticleNode;
}

function isSubset(subsetArray: string[], supersetArray: string[]) {
  return subsetArray.every((element) => supersetArray.includes(element));
}

export default class LawArticleTree {
  private tree: LawArticleNode[];
  private query: string;
  private validationQueries: any[];
  private finalArticles: LawArticle[];

  constructor(queryString: string) {
    this.tree = [];
    this.query = queryString;
    this.validationQueries = [];
    this.finalArticles = [];
  }

  public exec = async () => {
    await this.search();
    // await this.inflateArticles();
    await this.validateArticles();

    this.tree.forEach((t) => this.getFinalArticles(t));

    return this.finalArticles;
  };

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
    console.log(orderedTitles);
    console.log(articleCode);
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
      this.addArticle(treeHit, {
        content: articleContent,
        code: articleCode,
        mechanism: "semantic",
      });
    } else if (treeHit && titlesRemaining.length === 1) {
      treeHit.children?.push({
        name: titlesRemaining[0],
        parent: treeHit,
        articles: [
          {
            content: articleContent,
            code: articleCode,
            mechanism: "semantic",
          },
        ],
      });
    } else if (!treeHit) {
      if (!lastTreeHit) {
        this.tree.push(
          this.buildSubTree(orderedTitles, articleCode, articleContent)
        );
      } else {
        lastTreeHit.children?.push(
          this.buildSubTree(
            [currentTitle, ...titlesRemaining],
            articleCode,
            articleContent,
            lastTreeHit
          )
        );
      }
    }
  };

  private buildSubTree = (
    orderedTitles: string[],
    articleCode: string,
    articleContent: string,
    parent?: LawArticleNode
  ): LawArticleNode => {
    let currentTitle = orderedTitles[0];
    if (orderedTitles.length === 1) {
      const returnValue = {
        name: currentTitle,
        articles: [
          {
            content: articleContent,
            code: articleCode,
            mechanism: "semantic",
          },
        ],
      } as LawArticleNode;
      if (parent) returnValue.parent = parent;
      return returnValue;
    } else {
      let remainderTitles = orderedTitles.slice(1);
      const node: LawArticleNode = {
        name: orderedTitles[0],
      };

      if (parent) node.parent = parent;

      node.children = [
        this.buildSubTree(remainderTitles, articleCode, articleContent, node),
      ];

      return node;
    }
  };

  public printTree = () => {
    return JSON.stringify(
      this.tree.map((t) => this._printNode(t)),
      undefined,
      2
    );
  };

  private _printNode = (node: LawArticleNode): any => {
    return {
      name: node.name,
      validation: node.validation,
      articles: node.articles,
      children: node.children?.map((c: LawArticleNode) => this._printNode(c)),
    };
  };

  private getFinalArticles = (subTree: LawArticleNode) => {
    subTree.articles?.forEach((a) => {
      if (a.validation) this.finalArticles.push(a);
    });
    subTree.children?.forEach((c) => this.getFinalArticles(c));
  };

  public validateArticles = async () => {
    console.log("Build validation");
    this.tree.forEach((node) => this._buildNodeValidation(node));
    console.log("Start validation");

    while (this.validationQueries.length > 0) {
      const runList = this.validationQueries.splice(0, 20);
      await Promise.all(runList);
    }

    console.log("Finished validation");
  };

  private _buildNodeValidation = (subTree: LawArticleNode) => {
    subTree.articles?.forEach((a) => {
      if (a.mechanism === "semantic")
        this.validationQueries.push(
          withTimeout(
            llmQuery([
              {
                role: "system",
                content: `Du bist ein Rechtsbot und müsstest einschätzen, ob die Nutzereingabe Bezug auf den folgenden Schweizer Gesetze nimmt: \n\n"${a.content}" \n\nWenn es eine Verbindung oder Relevanz gibt, dann antworte mit "TRUE". Anderefalls "FALSE". Füge keinerlei weitere Erklärung hinzu.`,
              },
              {
                role: "user",
                content: this.query,
              },
            ]),
            30000
          )
            .then((validation) => {
              console.log(`Validated ${a.code}: ${validation}`);
              if (
                validation.toLowerCase().trim().replaceAll(`"`, "") === "true"
              )
                a.validation = true;
              if (
                validation.toLowerCase().trim().replaceAll(`"`, "") === "false"
              )
                a.validation = false;
            })
            .catch((e) => {
              console.log(e);
            })
        );
    });
    subTree.children?.forEach((c) => this._buildNodeValidation(c));
    /*
    if (subTree.children) {
      const validationString = this.getNodeValidationString(subTree);
      this.validationQueries.push(
        withTimeout(
          llmQuery([
            {
              role: "system",
              content: `Du bist ein Rechtsbot und müsstest einschätzen, ob die Nutzereingabe Bezug auf den folgenden Schweizer Gesetze nimmt: \n\n${validationString}\n\nWenn es eine Verbindung oder Relevanz gibt, dann antworte mit "TRUE". Anderefalls "FALSE". Füge keinerlei weitere Erklärung hinzu.`,
            },
            {
              role: "user",
              content: this.query,
            },
          ]),
          30000
        )
          .then((validation) => {
            console.log(`Validated ${subTree.name}`);
            if (validation.toLowerCase() === "true") subTree.validation = true;
            if (validation.toLowerCase() === "false")
              subTree.validation = false;
          })
          .catch((e) => {
            console.log(e);
          })
      );
    }
    */
  };

  public inflateArticles = async () => {
    await Promise.all(this.tree.map((c) => this._buildNodeInflation(c)));
  };

  private _buildNodeInflation = async (
    subTree: LawArticleNode,
    s?: string[]
  ) => {
    const query = [...(s || []), subTree.name];
    const results = [] as { metadata: string[]; index: number; text: string }[];

    try {
      const filters = await filterMetadataArray(query);

      for await (let result of filters) {
        const metadata = (result.document as any).metadata as string[];
        const text = (result.document as any).text as string;

        const index = metadata.findIndex((k) => k === subTree.name);
        if (isSubset(query, metadata)) results.push({ metadata, index, text });
      }
    } catch (e) {
      console.log(e);
    }

    for (let result of results) {
      const { index, metadata, text } = result;
      if (index === metadata.length - 2) {
        // console.log(`RESULT: ${metadata.slice(1)}`);
        console.log("Add article");

        this.addArticle(subTree, {
          content: text,
          code: metadata[metadata.length - 1],
          mechanism: "inflation",
        });
      } else if (
        subTree.name.toLowerCase().includes("allgemeine bestimmungen")
      ) {
        const remaningPath = metadata.slice(
          metadata.findIndex((i) => i === subTree.name) + 1,
          -1
        );
        this.addArticle(
          subTree,
          {
            content: text,
            code: metadata[metadata.length - 1],
            mechanism: "inflation",
          },
          remaningPath
        );
      }
    }

    if (subTree.children)
      await Promise.all(
        subTree.children?.map((c) =>
          this._buildNodeInflation(c, [...(s || []), subTree.name])
        )
      );
  };

  private addArticle = (
    subTree: LawArticleNode,
    article: LawArticle,
    path?: string[]
  ) => {
    let subTreeTemp = subTree;
    path?.forEach((p, i) => {
      const childIndex = subTreeTemp.children?.findIndex((c) => c.name === p);
      if (subTreeTemp.children && childIndex !== undefined && childIndex > -1) {
        subTreeTemp = subTreeTemp.children[childIndex];
      } else if (subTreeTemp.children) {
        const newChild = { name: p, parent: subTreeTemp };
        subTreeTemp.children.push(newChild);
        subTreeTemp = newChild;
      } else {
        subTreeTemp.children = [{ name: p, parent: subTreeTemp }];
        subTreeTemp = subTreeTemp.children[0];
      }
    });
    if (subTreeTemp.articles) {
      if (!subTreeTemp.articles.find((a) => a.code === article.code)) {
        subTreeTemp.articles.push(article);
      }
    } else {
      subTreeTemp.articles = [article];
    }
  };

  private getNodeValidationString = (subTree: LawArticleNode) => {
    let s = subTree.name;
    s = subTree.articles?.reduce((p, c) => p + "\n" + c.content, s) || s;

    subTree.children?.forEach((c) => {
      s = s + "\n" + this.getNodeValidationString(c);
    });

    return s;
  };
}
