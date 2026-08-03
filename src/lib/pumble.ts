/** Builds an "@id1 @id2" mention prefix from a comma-separated env var of Pumble member IDs. */
export function formatPumbleMentions(memberIdsCsv: string | undefined): string {
  if (!memberIdsCsv) return "";
  const ids = memberIdsCsv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.map((id) => `@${id}`).join(" ");
}

export async function sendPumbleMessage(webhookUrl: string | undefined, text: string) {
  if (!webhookUrl) {
    console.log(`[pumble:dev-fallback] Webhook not configured — logging instead of posting.\n${text}`);
    return;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error(`[pumble] Webhook post failed: ${res.status} ${await res.text()}`);
  }
}
