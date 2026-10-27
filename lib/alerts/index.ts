import { sendTelegram } from "./telegram";

export type AlertEvent = {
  kind: "down" | "recovered";
  siteName: string;
  baseUrl: string;
  path: string;
  error?: string | null;
};

export async function sendAlert(event: AlertEvent): Promise<void> {
  const target = `${event.siteName} ${event.path}`;
  const url = `${event.baseUrl.replace(/\/+$/, "")}${event.path}`;

  const text =
    event.kind === "down"
      ? `🔴 DOWN: ${target}\n${url}\nReason: ${event.error ?? "unknown"}`
      : `🟢 RECOVERED: ${target}\n${url}`;

  // an alert failure must never break the check run
  const results = await Promise.allSettled([sendTelegram(text)]);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("[alert]", r.reason);
  });
}
