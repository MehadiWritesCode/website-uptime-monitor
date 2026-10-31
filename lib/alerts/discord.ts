import type { AlertEvent } from "./index";

const WEBHOOK_PREFIXES = [
  "https://discord.com/api/webhooks/",
  "https://discordapp.com/api/webhooks/",
];

const COLORS = { down: 0xdc2626, recovered: 0x16a34a } as const;

export async function sendDiscord(event: AlertEvent): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return; // not configured -> skip silently

  if (!WEBHOOK_PREFIXES.some((p) => url.startsWith(p))) {
    throw new Error("DISCORD_WEBHOOK_URL is not a Discord webhook URL");
  }

  const target = `${event.baseUrl.replace(/\/+$/, "")}${event.path}`;
  const lines = [target];
  if (event.kind === "down" && event.error) {
    lines.push(`Reason: ${event.error.slice(0, 500)}`);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Uptime Monitor",
      // never let text from a response ping @everyone or roles
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: `${event.kind === "down" ? "DOWN" : "RECOVERED"}: ${event.siteName} ${event.path}`,
          description: lines.join("\n"),
          color: COLORS[event.kind],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Discord responded with ${res.status}`);
}
