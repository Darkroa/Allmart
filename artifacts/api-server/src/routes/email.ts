import { Router, type IRouter, type Request, type Response } from "express";
import { Resend } from "resend";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const FROM = process.env.RESEND_FROM ?? "AllMart <onboarding@resend.dev>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendOrderEmail(opts: {
  to: string;
  name: string;
  orderStatus: string;
  trackingCode: string;
  total: number;
  currency: string;
  shippingAddress: string;
}) {
  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: opts.currency }).format(opts.total);
  const statusMessages: Record<string, string> = {
    placed: "Your order has been placed and is being processed.",
    confirmed: "Your order has been confirmed and is being prepared.",
    dispatched: "Great news! Your order is on its way.",
    delivered: "Your order has been delivered. Enjoy!",
    cancelled: "Your order has been cancelled.",
  };
  const msg = statusMessages[opts.orderStatus] ?? `Your order status is now: ${opts.orderStatus}.`;
  const statusLabel = opts.orderStatus.charAt(0).toUpperCase() + opts.orderStatus.slice(1);

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `Order ${opts.trackingCode} — ${statusLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
        <div style="border-bottom:2px solid #1a56e8;padding-bottom:16px;margin-bottom:24px">
          <h1 style="color:#1a56e8;margin:0;font-size:24px">AllMart</h1>
        </div>
        <p style="color:#111;font-size:16px">Hi ${opts.name},</p>
        <p style="color:#333;font-size:15px">${msg}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #eee;border-radius:8px;overflow:hidden">
          <tr style="background:#f0f5ff">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Order ref</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${opts.trackingCode}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Total</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${fmt}</td>
          </tr>
          <tr style="background:#f0f5ff">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Shipping to</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee">${opts.shippingAddress}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px">Status</td>
            <td style="padding:12px 16px;text-transform:capitalize;color:#1a56e8;font-weight:600">${opts.orderStatus}</td>
          </tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
          — The AllMart Team · support@allmart.com
        </p>
      </div>`,
  });

  if (error) {
    logger.error({ error, to: opts.to, orderStatus: opts.orderStatus }, "Resend email failed");
    throw new Error(`Resend error: ${error.message}`);
  }

  logger.info({ id: data?.id, to: opts.to, orderStatus: opts.orderStatus }, "Order email sent");
}

export async function sendAdminPaymentAlert(opts: {
  trackingCode: string;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  paymentNote?: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nowbuy.com";
  if (!process.env.RESEND_API_KEY) return;

  const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: opts.currency }).format(opts.total);
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: FROM,
    to: [adminEmail],
    subject: `Payment screenshot uploaded — Order ${opts.trackingCode}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff">
        <div style="border-bottom:2px solid #1a56e8;padding-bottom:16px;margin-bottom:24px">
          <h1 style="color:#1a56e8;margin:0;font-size:24px">AllMart — Admin Alert</h1>
        </div>
        <p style="color:#111;font-size:16px;font-weight:600">A customer has uploaded a payment screenshot and is awaiting verification.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #eee;border-radius:8px;overflow:hidden">
          <tr style="background:#f0f5ff">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee;width:140px">Order ref</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${opts.trackingCode}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Customer</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee">${opts.customerName} (${opts.customerEmail})</td>
          </tr>
          <tr style="background:#f0f5ff">
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Order total</td>
            <td style="padding:12px 16px;font-weight:bold;border-bottom:1px solid #eee">${fmt}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;border-bottom:1px solid #eee">Shipping to</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee">${opts.shippingAddress}</td>
          </tr>
          ${opts.paymentNote ? `
          <tr style="background:#f0f5ff">
            <td style="padding:12px 16px;color:#666;font-size:13px">Customer note</td>
            <td style="padding:12px 16px;font-style:italic">${opts.paymentNote}</td>
          </tr>` : ""}
        </table>
        <a href="https://${process.env.REPLIT_DEV_DOMAIN ?? "localhost"}/orders"
           style="display:inline-block;background:#1a56e8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Review in Admin Panel →
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
          — AllMart automated alert
        </p>
      </div>`,
  });

  if (error) {
    logger.error({ error }, "Admin payment alert email failed");
  } else {
    logger.info({ trackingCode: opts.trackingCode, adminEmail }, "Admin payment alert sent");
  }
}

router.post("/email/order-status", async (req: Request, res: Response) => {
  const { to, name, orderStatus, trackingCode, total, currency, shippingAddress } = req.body as {
    to: string; name: string; orderStatus: string;
    trackingCode: string; total: number; currency: string; shippingAddress: string;
  };
  try {
    await sendOrderEmail({ to, name, orderStatus, trackingCode, total, currency, shippingAddress });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Email failed", detail: String(err) });
  }
});

router.post("/email/test", async (req: Request, res: Response) => {
  const { to } = req.body as { to?: string };
  if (!to) { res.status(400).json({ error: "to required" }); return; }
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "AllMart — Email test",
    html: "<div style='font-family:sans-serif;padding:24px'><h2 style='color:#1a56e8'>AllMart</h2><p>This is a test email. If you received this, emails are working correctly!</p></div>",
  });
  res.json({ data, error });
});

export default router;
