import { Router, type IRouter, type Request, type Response } from "express";
import { db, visitorsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";
import { requireRole } from "../lib/auth";
import { sendTelegram } from "../lib/telegram";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function lookupCountry(ip: string): Promise<{ country: string; countryCode: string; city: string } | null> {
  if (!ip || ip === "unknown" || ip.startsWith("127.") || ip.startsWith("::")) return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { status: string; country?: string; countryCode?: string; city?: string };
    if (data.status !== "success") return null;
    return { country: data.country ?? "", countryCode: data.countryCode ?? "", city: data.city ?? "" };
  } catch {
    return null;
  }
}

router.post("/visitors/track", async (req: Request, res: Response) => {
  const { page, referrer } = req.body as { page?: string; referrer?: string };
  const sessionId = req.sessionId;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const userAgent = req.headers["user-agent"] ?? null;

  const [existing] = await db
    .select({ id: visitorsTable.id, country: visitorsTable.country, city: visitorsTable.city })
    .from(visitorsTable)
    .where(eq(visitorsTable.sessionId, sessionId))
    .limit(1);

  const isReturning = !!existing;

  let country: string | undefined;
  let city: string | undefined;

  if (existing?.country) {
    country = existing.country;
    city = existing.city ?? undefined;
  } else {
    const geo = await lookupCountry(ip);
    if (geo) { country = `${geo.countryCode}|${geo.country}`; city = geo.city; }
  }

  await db.insert(visitorsTable).values({
    sessionId,
    ip,
    country: country ?? null,
    city: city ?? null,
    userAgent: userAgent ?? undefined,
    referrer: referrer ?? null,
    page: page ?? "/",
    isReturning,
  });

  if (!isReturning) {
    try {
      const adminUsers = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.role, "admin"));

      const pageLabel = page ?? "/";
      const geoLabel = city && country ? ` from ${city}, ${country.split("|")[1] ?? country}` : "";

      if (adminUsers.length > 0) {
        await db.insert(notificationsTable).values(
          adminUsers.map((a) => ({
            userId: a.id,
            title: "New visitor",
            message: `Someone just visited ${pageLabel}${geoLabel}. IP: ${ip}`,
          }))
        );
      }

      await sendTelegram(
        `👤 <b>New visitor</b>\n` +
        `📄 Page: <code>${pageLabel}</code>\n` +
        (geoLabel ? `🌍 Location: ${geoLabel.trim()}\n` : "") +
        (referrer ? `🔗 From: ${referrer}\n` : "") +
        `🌐 IP: <code>${ip}</code>\n` +
        `🕒 ${new Date().toUTCString()}`
      );
    } catch (err) {
      logger.error({ err }, "visitor notification failed");
    }
  }

  res.status(204).end();
});

router.get("/admin/visitors/live", requireRole("admin", "pm"), async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 5 * 60_000);

  const rows = await db
    .select()
    .from(visitorsTable)
    .where(gte(visitorsTable.createdAt, since))
    .orderBy(desc(visitorsTable.createdAt));

  const sessionMap = new Map<string, {
    sessionId: string;
    ip: string | null;
    country: string | null;
    city: string | null;
    currentPage: string;
    firstSeen: Date;
    lastSeen: Date;
    pages: string[];
  }>();

  for (const row of rows) {
    const existing = sessionMap.get(row.sessionId);
    if (!existing) {
      sessionMap.set(row.sessionId, {
        sessionId: row.sessionId,
        ip: row.ip,
        country: row.country,
        city: row.city,
        currentPage: row.page,
        firstSeen: row.createdAt,
        lastSeen: row.createdAt,
        pages: [row.page],
      });
    } else {
      if (row.createdAt < existing.firstSeen) existing.firstSeen = row.createdAt;
      if (row.createdAt > existing.lastSeen) {
        existing.lastSeen = row.createdAt;
        existing.currentPage = row.page;
      }
      if (!existing.pages.includes(row.page)) existing.pages.push(row.page);
      if (!existing.country && row.country) existing.country = row.country;
      if (!existing.city && row.city) existing.city = row.city;
    }
  }

  const live = Array.from(sessionMap.values()).map((s) => ({
    sessionId: s.sessionId,
    ip: s.ip,
    country: s.country,
    city: s.city,
    currentPage: s.currentPage,
    firstSeen: s.firstSeen.toISOString(),
    lastSeen: s.lastSeen.toISOString(),
    timeSpentMs: s.lastSeen.getTime() - s.firstSeen.getTime(),
    pagesVisited: s.pages,
  }));

  res.json({ count: live.length, sessions: live });
});

router.get("/admin/visitors", requireRole("admin", "pm"), async (req: Request, res: Response) => {
  const { days = "7" } = req.query as { days?: string };
  const since = new Date(Date.now() - Number(days) * 86400_000);

  const rows = await db
    .select()
    .from(visitorsTable)
    .where(gte(visitorsTable.createdAt, since))
    .orderBy(desc(visitorsTable.createdAt))
    .limit(200);

  const total = rows.length;
  const unique = new Set(rows.map((r) => r.sessionId)).size;
  const returning = rows.filter((r) => r.isReturning).length;

  const byPage = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.page] = (acc[r.page] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  res.json({ total, unique, returning, rows: rows.slice(0, 100), byPage });
});

export default router;
