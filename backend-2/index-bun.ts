import { handler } from "./index";

// bun adapter for the lambda function in ./index.ts
Bun.serve({
  port: 8080,
  development: true,
  async fetch(req) {
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
