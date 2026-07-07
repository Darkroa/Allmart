import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomInt } from "crypto";
import { sendEmail } from "./email";
import { logger } from "../lib/logger";
import { getUserFromCookie } from "../lib/auth";
import { verificationResendLimiter, verificationAttemptLimiter } from "../lib/rate-limit";

const router: IRouter = Router();

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function generateCode() {
  return String(randomInt(100000, 999999));
}

/** Send (or resend) verification code to the current user. */
router.post("/auth/send-verification", async (req: Request, res: Response) => {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: "Sign in required" }); return; }
  if (user.emailVerified) { res.json({ ok: true, alreadyVerified: true }); return; }

  // Rate limit: 5 resends per email per 10 minutes
  if (!verificationResendLimiter.allow(user.email)) {
    res.status(429).json({ error: "Too many requests. Please wait before requesting another code." });
    return;
  }

  const code = generateCode();
  const expiry = new Date(Date.now() + CODE_TTL_MS);

  await db.update(usersTable).set({
    emailVerificationCode: code,
    emailVerificationExpiry: expiry,
  }).where(eq(usersTable.id, user.id));

  sendEmail({
    to: user.email,
    subject: "Your AllMart verification code",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#e07b39;margin-bottom:8px">Verify your email</h2>
        <p>Hi <strong>${user.name}</strong>, use the code below to verify your AllMart account.</p>
        <div style="margin:24px 0;padding:20px;background:#f9f5f1;border-radius:12px;text-align:center">
          <p style="font-size:36px;font-weight:700;letter-spacing:8px;color:#e07b39;margin:0">${code}</p>
          <p style="font-size:12px;color:#888;margin:8px 0 0">Expires in 30 minutes</p>
        </div>
        <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
  }).catch((err) => { logger.error({ err, to: user.email }, "Verification email failed"); });

  res.json({ ok: true });
});

/** Verify email with submitted code. */
router.post("/auth/verify-email", async (req: Request, res: Response) => {
  const user = await getUserFromCookie(req);
  if (!user) { res.status(401).json({ error: "Sign in required" }); return; }
  if (user.emailVerified) { res.json({ ok: true }); return; }

  // Rate limit: 10 attempts per user per 30 minutes
  if (!verificationAttemptLimiter.allow(String(user.id))) {
    res.status(429).json({ error: "Too many attempts. Please request a new code and try again later." });
    return;
  }

  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "Code required" }); return; }

  if (
    user.emailVerificationCode !== code.trim() ||
    !user.emailVerificationExpiry ||
    user.emailVerificationExpiry < new Date()
  ) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  await db.update(usersTable).set({
    emailVerified: true,
    emailVerificationCode: null,
    emailVerificationExpiry: null,
  }).where(eq(usersTable.id, user.id));

  res.json({ ok: true });
});

export default router;
