import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, referralsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignUpBody, SignInBody } from "@workspace/api-zod";
import { getUserFromCookie } from "../lib/auth";
import { sendEmail } from "./email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const AUTH_COOKIE = "nb_user";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/",
};

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.referralCode, code));
    if (!existing) return code;
  }
  return generateReferralCode() + Math.floor(Math.random() * 100);
}

async function getSetting(key: string, fallback: string) {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return row?.value ?? fallback;
}

function publicUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tier: u.tier,
    country: u.country ?? null,
    phone: u.phone ?? null,
    sex: u.sex ?? null,
    address: u.address ?? null,
    profileComplete: u.profileComplete,
    referralCode: u.referralCode ?? null,
    bonusBalance: u.bonusBalance,
  };
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, name, password } = parsed.data;
  const normalized = email.trim().toLowerCase();
  const refCode = (req.body as { referralCode?: string }).referralCode?.trim().toUpperCase() ?? null;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalized));
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  const referralCode = await uniqueReferralCode();
  const passwordHash = await bcrypt.hash(password, 10);

  let signupBonus = 0;
  let referrer: typeof usersTable.$inferSelect | null = null;

  if (refCode) {
    const [ref] = await db.select().from(usersTable).where(eq(usersTable.referralCode, refCode));
    if (ref) {
      referrer = ref;
      signupBonus = Number(await getSetting("referralSignupBonus", "20"));
    }
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      email: normalized,
      name,
      passwordHash,
      role: "buyer",
      referralCode,
      bonusBalance: signupBonus,
    })
    .returning();

  if (referrer && user) {
    const referrerBonus = Number(await getSetting("referralReferrerBonus", "10"));
    await db.insert(referralsTable).values({
      referrerId: referrer.id,
      referredId: user.id,
      referrerBonus,
      referredBonus: signupBonus,
    }).onConflictDoNothing();
  }

  res.cookie(AUTH_COOKIE, String(user!.id), COOKIE_OPTS);
  res.json(publicUser(user!));

  // Welcome email — fire and forget
  sendEmail({
    to: user!.email,
    subject: "Welcome to AllMart 🎉",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#e07b39">Welcome to AllMart, ${user!.name}!</h2>
        <p>Your account has been created successfully. Start shopping thousands of products across every category.</p>
        ${signupBonus > 0 ? `<p>🎁 You've received a <strong>${signupBonus} signup bonus</strong> credited to your account!</p>` : ""}
        <p style="margin-top:24px;color:#888;font-size:12px">If you didn't create this account, please ignore this email.</p>
      </div>`,
  }).catch((err) => { logger.error({ err, to: user!.email }, "Welcome email failed"); });
});

router.post("/auth/signin", async (req: Request, res: Response) => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { email, password } = parsed.data;
  const normalized = email.trim().toLowerCase();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalized));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.cookie(AUTH_COOKIE, String(user.id), COOKIE_OPTS);
  res.json(publicUser(user));

  // Login notification — fire and forget
  const loginTime = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "full", timeStyle: "short" });
  sendEmail({
    to: user.email,
    subject: "New login to your AllMart account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#e07b39">Login detected</h2>
        <p>Hi <strong>${user.name}</strong>, a new sign-in to your AllMart account was detected.</p>
        <table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#888">Time</td><td style="padding:6px 0">${loginTime} (Lagos)</td></tr>
        </table>
        <p style="color:#e07b39;font-weight:600">If this wasn't you, please change your password immediately.</p>
        <p style="margin-top:24px;color:#888;font-size:12px">This is an automated security notification from AllMart.</p>
      </div>`,
  }).catch((err) => { logger.error({ err, to: user.email }, "Login notification email failed"); });
});

router.post("/auth/signout", (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.status(204).end();
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const raw = req.cookies?.[AUTH_COOKIE];
  const id = Number(raw);
  if (!raw || !Number.isFinite(id)) {
    res.json({ user: null });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  res.json({ user: user ? publicUser(user) : null });
});

router.patch("/auth/password", async (req: Request, res: Response) => {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: "Sign in required" }); return; }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
  res.json({ ok: true });
});

export default router;
