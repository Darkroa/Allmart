import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/sitemap.xml", async (req: Request, res: Response) => {
  const products = await db.select({ id: productsTable.id, category: productsTable.category }).from(productsTable);

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim() ?? req.hostname;
  const base = `https://${domain}`;

  const staticUrls = ["/", "/products", "/assistant", "/cart", "/orders", "/support"].map(
    (path) =>
      `<url><loc>${base}${path}</loc><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`
  );

  const categories = [...new Set(products.map((p) => p.category))].map(
    (cat) =>
      `<url><loc>${base}/products?category=${encodeURIComponent(cat)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
  );

  const productUrls = products.map(
    (p) =>
      `<url><loc>${base}/products/${p.id}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...categories, ...productUrls].join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.send(xml);
});

export default router;
