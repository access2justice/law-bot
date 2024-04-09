import { handler } from "./index";
import LawArticleTree from "./search/law-article-tree";
import { testTraverseResults } from "./search/traverse-results";

// bun adapter for the lambda function in ./index.ts
Bun.serve({
  port: 8080,
  development: true,
  async fetch(req) {
    if (new URL(req.url).pathname === "/test") {
      const lawArticleTree = new LawArticleTree(
        "Was sind die Voraussetzungen für die Gründung einer GmbH"
      );
      await lawArticleTree.search();
      await lawArticleTree.validateArticles();
      return new Response(lawArticleTree.printTree());
    }

    if (!req.body) {
      return new Response("Missing body!", { status: 400 });
    }
    const bodyJson = await Bun.readableStreamToJSON(req.body);
    // @ts-ignore
    const result = await handler({
      headers: req.headers,
      body: JSON.stringify(bodyJson),
    });
    // @ts-ignore
    return new Response(JSON.stringify(result.body));
  },
});

console.log("Bun listening http://localhost:8080");
