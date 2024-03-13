import type { RequestContext } from "@vercel/edge";

export const config = {
  runtime: "edge",
};

export default async function MyEdgeFunction(
  req: Request,
  context: RequestContext
) {
  const data = await req.json();

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
    console.log("0. Initiate message" + new Date());
    context.waitUntil(
      (async () => {
        console.log("1. Start message" + new Date());
        await fetch(
          `https://${process.env.VERCEL_URL}/api/slack/process-events`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        )
          .then((json) => {
            console.log("2a. Success message" + new Date());
            console.log({ json });
          })
          .catch((error) => {
            console.log("2b. Success message" + new Date());
            console.log("Error fetching process-events:", error);
          });
      })()
    );
    console.log("x. Return message" + new Date());

    return new Response(Date.now() + "");
  }

  return new Response(Date.now() + "");
}
