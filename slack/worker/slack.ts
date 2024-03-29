import { WebClient } from "@slack/web-api";

const web = new WebClient(process.env.SLACK_TOKEN);

export async function sendSlackMessage(
  channel: any,
  thread: any,
  text: any,
  messageBlocks?: any
) {
  return web.chat.postMessage({
    channel: channel,
    thread_ts: thread,
    text: text,
    blocks: messageBlocks,
  });
}
