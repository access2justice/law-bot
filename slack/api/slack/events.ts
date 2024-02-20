import { WebClient } from "@slack/web-api";
import type { RequestContext } from "@vercel/edge";

export const config = {
  runtime: "edge",
};

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function MyEdgeFunction(
  req: Request,
  context: RequestContext
) {
  console.log(1);
  const data = await req.json();
  console.log(2);

  console.log(data);

  if (data.type === "url_verification") {
    return Response.json({ challenge: data.challenge });
  }

  if (
    !data.event.thread_ts &&
    !data.event.parent_user_id &&
    data.event.type === "message" &&
    data.type === "event_callback" &&
    (data.event.channel === "C06GGJVRMCK" ||
      data.event.channel === "C06HA3ZLB18")
  ) {
    context.waitUntil(
      fetch(`${process.env.VERCEL_URL}/api/slack/process-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((json) => console.log({ json }))
    );

    return new Response(Date.now() + "");
  }

  return new Response(Date.now() + "");
}
