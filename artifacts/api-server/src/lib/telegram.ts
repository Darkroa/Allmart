import { logger } from "./logger";

const BASE = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export function isTelegramConfigured() {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(text: string): Promise<void> {
  if (!isTelegramConfigured()) return;
  try {
    const res = await fetch(`${BASE()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body }, "Telegram sendMessage failed");
    }
  } catch (err) {
    logger.error({ err }, "Telegram fetch error");
  }
}

export async function setWebhook(webhookUrl: string): Promise<unknown> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const res = await fetch(`${BASE()}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  return res.json();
}
