import type { RequestContext } from "@vercel/edge";

export const config = {
  runtime: "edge",
};

export default async function MyEdgeFunction(
  req: Request,
  context: RequestContext
) {
  console.log(1);
  const data = await req.json();
  console.log(2);

  console.log(data);

  if (data.type === "url_verification") {
    return new Response(JSON.stringify({ challenge: data.challenge }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
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
    fetch('/api/slack/process-events', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => console.log({ json }))
      .catch((error) => console.log("Error fetching process-events:", error));
    );

    return new Response(Date.now() + "");
  }

  return new Response(Date.now() + "");
}
