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
