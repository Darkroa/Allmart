import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  createProduct,
  getListProductsQueryKey,
  getListCategoriesQueryKey,
  getGetStorefrontSummaryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COLUMNS = [
  "name",
  "description",
  "category",
  "price",
  "originalPrice",
  "shippingFee",
  "stock",
  "sellerName",
  "rating",
  "tags",
  "imageUrl",
  "colors",
  "productType",
];

function toProductSlug(name: string, id: number) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + id;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

type ImportResult = { ok: number; errors: { row: number; msg: string }[] };

export function CsvImportExport({ sellerName }: { sellerName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products } = useListProducts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // ── EXPORT ────────────────────────────────────────────────
  function handleExport() {
    if (!products || products.length === 0) {
      toast({ title: "No products to export", variant: "destructive" });
      return;
    }
    const exportColumns = [...COLUMNS, "url"];
    const header = exportColumns.join(",");
    const origin = window.location.origin;
    const rows = products.map((p) =>
      [
        p.name, p.description, p.category, p.price,
        p.originalPrice ?? "", (p as { shippingFee?: number | null }).shippingFee ?? "",
        p.stock, p.sellerName, p.rating,
        (p.tags ?? []).join("|"), p.imageUrl,
        (p.colors ?? []).join("|"), p.productType ?? "",
        `${origin}/products/${toProductSlug(p.name, p.id)}`,
      ].map(escapeCsvCell).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `allmart-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    toast({ title: `Exported ${products.length} products` });
  }

  // ── DOWNLOAD TEMPLATE ─────────────────────────────────────
  function handleTemplate() {
    const header = COLUMNS.join(",");
    const example = [
      "Classic Leather Sneakers",
      "Timeless leather sneakers for everyday style",
      "shoes",
      "49.99",
      "69.99",
      "50",
      sellerName || "AllMart",
      "4.5",
      "fashion|leather|unisex",
      "",
      "White|Black|Brown",
      "Sneakers",
    ].map(escapeCsvCell).join(",");
    const notes = [
      "# AllMart Product Import Template",
      "# imageUrl — leave blank to use a placeholder; add real images later via Manage Products",
      "# tags and colors — separate multiple values with | (pipe, not comma)",
      "# price and originalPrice — USD amounts e.g. 49.99 = $49.99",
      "# originalPrice — leave blank if there is no before/compare-at price",
      "# url — auto-generated on export (read-only, not used during import)",
      "",
    ].join("\n");
    const csv = notes + header + "\n" + example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "allmart-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template downloaded" });
  }

  // ── IMPORT ────────────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setResult(null);

    const text = await file.text();
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

    if (lines.length < 2) {
      setResult({ ok: 0, errors: [{ row: 0, msg: "CSV has no data rows." }] });
      setImporting(false);
      return;
    }

    const header = parseCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
    const idx = (col: string) => header.indexOf(col);

    const PLACEHOLDER =
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

    let ok = 0;
    const errors: { row: number; msg: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]!);
      const get = (col: string) => cells[idx(col)]?.trim() ?? "";

      const name = get("name");
      const description = get("description");
      const category = get("category");
      const priceRaw = get("price");
      const stockRaw = get("stock");
      const imageUrl = get("imageurl") || get("image_url") || get("imageurl");

      if (!name) { errors.push({ row: i + 1, msg: "Missing name" }); continue; }
      if (!category) { errors.push({ row: i + 1, msg: "Missing category" }); continue; }

      const price = parseFloat(priceRaw);
      const stock = parseInt(stockRaw, 10);
      if (isNaN(price) || price < 0) { errors.push({ row: i + 1, msg: `Invalid price "${priceRaw}"` }); continue; }
      if (isNaN(stock) || stock < 0) { errors.push({ row: i + 1, msg: `Invalid stock "${stockRaw}"` }); continue; }

      const origRaw = get("originalprice") || get("original_price");
      const originalPrice = origRaw ? parseFloat(origRaw) : null;
      const shippingFeeRaw = get("shippingfee") || get("shipping_fee");
      const shippingFee = shippingFeeRaw ? parseFloat(shippingFeeRaw) : null;
      const rating = parseFloat(get("rating")) || 4.5;
      const tags = get("tags").split("|").map((t) => t.trim()).filter(Boolean);
      const colors = get("colors").split("|").map((c) => c.trim()).filter(Boolean);
      const productType = get("producttype") || get("product_type") || "";
      const rowSeller = get("sellername") || get("seller_name") || sellerName;

      try {
        const created = await createProduct({
          name,
          description: description || name,
          category: category.toLowerCase(),
          price,
          currency: "USD",
          imageUrl: imageUrl || PLACEHOLDER,
          stock,
          sellerName: rowSeller,
          rating,
          tags,
        });

        if (colors.length > 0 || productType || (originalPrice !== null) || (shippingFee !== null)) {
          await fetch(`/api/admin/products/${created.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ colors, productType, originalPrice, shippingFee }),
          });
        }
        ok++;
      } catch (err) {
        const msg =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          String(err);
        errors.push({ row: i + 1, msg });
      }
    }

    if (ok > 0) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetStorefrontSummaryQueryKey() }),
      ]);
    }

    setResult({ ok, errors });
    setImporting(false);
    toast({
      title: ok > 0 ? `Imported ${ok} product${ok === 1 ? "" : "s"}` : "Import finished",
      variant: errors.length > 0 && ok === 0 ? "destructive" : "default",
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {/* Header — matches ProductForm style */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold">CSV Import / Export</h3>
          <p className="text-xs text-muted-foreground">Bulk-add or download your full catalog.</p>
        </div>
      </div>

      {/* Column reference */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
          CSV columns
        </Label>
        <div className="flex flex-wrap gap-1.5 rounded-lg bg-muted/40 border border-border/40 p-3">
          {COLUMNS.map((col) => (
            <span
              key={col}
              className="rounded bg-background border border-border/50 px-2 py-0.5 font-mono text-[11px]"
            >
              {col}
            </span>
          ))}
        </div>
        <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
          <li>• <strong>imageUrl</strong> — leave blank; add images later in Manage Products</li>
          <li>• <strong>tags</strong> &amp; <strong>colors</strong> — use <code className="bg-muted px-1 rounded">|</code> to separate values, not comma</li>
          <li>• <strong>price</strong> — USD amount, e.g. <code className="bg-muted px-1 rounded">49.99</code> = $49.99</li>
          <li>• <strong>url</strong> — included in export only (auto-generated, ignored on import)</li>
        </ul>
      </div>

      {/* Three action buttons — same width as form buttons */}
      <div className="grid sm:grid-cols-3 gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          className="gap-2 h-10"
          onClick={handleTemplate}
        >
          <FileDown className="h-4 w-4" />
          Get template
        </Button>

        <Button
          type="button"
          variant="outline"
          className="gap-2 h-10"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
          Export CSV
          {products && (
            <span className="ml-1 text-[10px] text-muted-foreground font-normal">
              ({products.length})
            </span>
          )}
        </Button>

        <label htmlFor="csv-import-file" className="block">
          <Button
            type="button"
            asChild={false}
            variant="default"
            className="gap-2 h-10 w-full"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</>
            ) : (
              <><Upload className="h-4 w-4" /> Import CSV</>
            )}
          </Button>
          <input
            ref={fileRef}
            id="csv-import-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-2">
          {result.ok > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Imported <strong>{result.ok}</strong> product{result.ok === 1 ? "" : "s"} successfully.
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" />
                {result.errors.length} row{result.errors.length === 1 ? "" : "s"} failed
              </div>
              <ul className="text-xs text-destructive/80 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>• Row {e.row}: {e.msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
