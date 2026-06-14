import { Router, type IRouter, type Request, type Response } from "express";
import { db, referralsTable, usersTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

async function getSetting(key: string, fallback: string) {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return row?.value ?? fallback;
}

async function setSetting(key: string, value: string) {
  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  if (existing) {
    await db.update(settingsTable).set({ value, updatedAt: new Date() }).where(eq(settingsTable.key, key));
  } else {
    await db.insert(settingsTable).values({ key, value });
  }
}

router.get("/admin/referral-settings", requireRole("admin"), async (_req: Request, res: Response) => {
  const [referrerBonus, signupBonus, note] = await Promise.all([
    getSetting("referralReferrerBonus", "10"),
    getSetting("referralSignupBonus", "20"),
    getSetting("referralNote", "Refer friends and earn bonus credits you can use on your next order!"),
  ]);
  res.json({
    referralReferrerBonus: Number(referrerBonus),
    referralSignupBonus: Number(signupBonus),
    referralNote: note,
  });
});

router.patch("/admin/referral-settings", requireRole("admin"), async (req: Request, res: Response) => {
  const { referralReferrerBonus, referralSignupBonus, referralNote } = req.body as {
    referralReferrerBonus?: number; referralSignupBonus?: number; referralNote?: string;
  };
  if (referralReferrerBonus !== undefined) await setSetting("referralReferrerBonus", String(referralReferrerBonus));
  if (referralSignupBonus !== undefined) await setSetting("referralSignupBonus", String(referralSignupBonus));
  if (referralNote !== undefined) await setSetting("referralNote", referralNote);
  res.json({ ok: true });
});

router.get("/admin/referrals", requireRole("admin"), async (_req: Request, res: Response) => {
  const all = await db.select().from(referralsTable).orderBy(referralsTable.createdAt);

  const userIds = [...new Set([...all.map(r => r.referrerId), ...all.map(r => r.referredId)])];
  const users: { id: number; name: string; email: string }[] = [];
  for (const uid of userIds) {
    const [u] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(eq(usersTable.id, uid));
    if (u) users.push(u);
  }
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json(all.map(r => ({
    id: r.id,
    referrer: userMap.get(r.referrerId) ?? { id: r.referrerId, name: "Unknown", email: "" },
    referred: userMap.get(r.referredId) ?? { id: r.referredId, name: "Unknown", email: "" },
    referrerBonus: r.referrerBonus,
    referredBonus: r.referredBonus,
    referrerClaimed: r.referrerClaimed,
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
