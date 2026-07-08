import { Router, type IRouter, type Request, type Response } from "express";
import { db, settingsTable, productsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "../lib/auth";
import { serializeProduct } from "../lib/serializers";

const router: IRouter = Router();

const FLASH_SALE_KEY = "flash_sale";

type FlashSaleConfig = {
  enabled: boolean;
  endsAt: string | null;
  productIds: number[];
};

const DEFAULT_CONFIG: FlashSaleConfig = { enabled: false, endsAt: null, productIds: [] };

async function readConfig(): Promise<FlashSaleConfig> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, FLASH_SALE_KEY));
  if (rows.length === 0) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(rows[0]!.value);
    return {
      enabled: !!parsed.enabled,
      endsAt: parsed.endsAt ?? null,
      productIds: Array.isArray(parsed.productIds) ? parsed.productIds : [],
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function buildResponse(config: FlashSaleConfig) {
  const isLive = config.enabled && !!config.endsAt && new Date(config.endsAt).getTime() > Date.now() && config.productIds.length > 0;

  if (!isLive || config.productIds.length === 0) {
    return { enabled: false, endsAt: config.endsAt, productIds: config.productIds, products: [] };
  }

  const rows = await db.select().from(productsTable).where(inArray(productsTable.id, config.productIds));
  const byId = new Map(rows.map(r => [r.id, r]));
  const products = config.productIds
    .map(id => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(serializeProduct);

  return { enabled: true, endsAt: config.endsAt, productIds: config.productIds, products };
}

router.get("/flash-sale", async (_req: Request, res: Response) => {
  const config = await readConfig();
  res.json(await buildResponse(config));
});

router.get("/admin/flash-sale", requireRole("admin", "pm"), async (_req: Request, res: Response) => {
  const config = await readConfig();
  const rows = config.productIds.length
    ? await db.select().from(productsTable).where(inArray(productsTable.id, config.productIds))
    : [];
  const byId = new Map(rows.map(r => [r.id, r]));
  const products = config.productIds
    .map(id => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(serializeProduct);
  res.json({ enabled: config.enabled, endsAt: config.endsAt, productIds: config.productIds, products });
});

router.put("/admin/flash-sale", requireRole("admin", "pm"), async (req: Request, res: Response) => {
  const { enabled, endsAt, productIds } = req.body as {
    enabled?: boolean;
    endsAt?: string | null;
    productIds?: number[];
  };

  if (typeof enabled !== "boolean" || !Array.isArray(productIds)) {
    res.status(400).json({ error: "enabled and productIds are required" });
    return;
  }

  const config: FlashSaleConfig = {
    enabled,
    endsAt: endsAt ?? null,
    productIds: productIds.filter((id) => Number.isFinite(id)),
  };

  const value = JSON.stringify(config);
  await db
    .insert(settingsTable)
    .values({ key: FLASH_SALE_KEY, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });

  res.json(await buildResponse(config));
});

export default router;
