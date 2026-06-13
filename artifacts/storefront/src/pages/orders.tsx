import { useRef, useState } from "react";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Package, ArrowRight, Clock, CreditCard, ImageIcon,
  ShieldCheck, ShieldX, Upload, X, Loader2, RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/use-image-upload";

type ExtOrder = {
  id: number;
  status: string;
  total: number;
  currency: string;
  trackingCode: string;
  createdAt: string;
  items: { productId: number; productName: string; quantity: number; imageUrl?: string }[];
  paymentScreenshotUrl?: string;
  paymentVerified?: string;
  paymentNote?: string;
};

function ResubmitPanel({ order, onDone }: { order: ExtOrder; onDone: () => void }) {
  const { toast } = useToast();
  const { upload, isUploading, progress, error } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [note, setNote] = useState(order.paymentNote ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    try {
      const result = await upload(file);
      setScreenshotUrl(result.servingUrl);
    } catch {
      setPreview(null);
    }
  }

  async function handleSubmit() {
    if (!screenshotUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/resubmit-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentScreenshotUrl: screenshotUrl, paymentNote: note }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Payment screenshot resubmitted", description: "We'll review it shortly." });
      onDone();
    } catch {
      toast({ title: "Failed to resubmit", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 sm:px-8 pb-5 pt-0">
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <ShieldX className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Payment rejected</p>
            <p className="text-xs text-rose-600/80 mt-0.5">
              Your previous screenshot could not be verified. Please upload a clear photo of your payment receipt.
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-rose-200 rounded-lg p-4 flex flex-col items-center gap-2 text-rose-400 hover:border-rose-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Click to upload new payment screenshot</span>
          </button>
        ) : (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full max-h-48 rounded-lg object-contain border border-border/40" />
            {!isUploading && !screenshotUrl && (
              <button
                onClick={() => { setPreview(null); setScreenshotUrl(null); }}
                className="absolute top-2 right-2 bg-background/90 rounded-full p-1 shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {isUploading && (
              <div className="mt-2 space-y-1">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground text-center">{progress}% uploading…</p>
              </div>
            )}
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>
        )}

        <Textarea
          placeholder="Add a note (optional) — e.g. reference number, transfer time…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-xs resize-none"
        />

        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!screenshotUrl || isUploading || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Resubmit payment
          </Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setPreview(null); setScreenshotUrl(null); setNote(""); }}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useListOrders();

  function handleResubmitDone() {
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
  }

  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Orders</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container max-w-screen-xl mx-auto py-24 px-6 text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-4">No orders yet</h2>
        <p className="text-muted-foreground mb-8">
          You haven't placed any orders. Start exploring our collection to find something you love.
        </p>
        <Link href="/products">
          <Button size="lg" className="w-full sm:w-auto h-12 px-8">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-serif font-bold tracking-tight mb-10">Your Orders</h1>

      <div className="grid gap-6">
        {orders.map((order) => {
          const ext = order as unknown as ExtOrder;
          const pv = ext.paymentVerified ?? "pending";
          const hasScreenshot = !!ext.paymentScreenshotUrl;
          const isRejected = hasScreenshot && pv === "rejected";

          return (
            <Card key={order.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-muted/30 p-5 sm:px-8 border-b border-border/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Order Placed</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Total</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Tracking</p>
                    <p className="font-mono text-xs mt-0.5 font-medium bg-background px-2 py-0.5 rounded border border-border/50">
                      {order.trackingCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Badge variant="outline" className={`capitalize px-3 py-1 font-medium ${
                    order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' :
                    order.status === 'dispatched' ? 'bg-violet-500/10 text-violet-700 border-violet-200' :
                    order.status === 'confirmed' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                    order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-700 border-rose-200' :
                    'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {order.status}
                  </Badge>
                  {hasScreenshot && (
                    <Badge variant="outline" className={`px-3 py-1 font-medium flex items-center gap-1 ${
                      pv === "verified" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" :
                      pv === "rejected" ? "bg-rose-500/10 text-rose-700 border-rose-200" :
                      "bg-amber-500/10 text-amber-700 border-amber-200"
                    }`}>
                      {pv === "verified" ? <ShieldCheck className="h-3.5 w-3.5" /> :
                       pv === "rejected" ? <ShieldX className="h-3.5 w-3.5" /> :
                       <ImageIcon className="h-3.5 w-3.5" />}
                      {pv === "verified" ? "Payment verified" :
                       pv === "rejected" ? "Payment rejected" :
                       "Awaiting verification"}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-5 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex gap-3">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center overflow-hidden relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain mix-blend-multiply p-1" />
                      ) : (
                        <Package className="h-6 w-6 text-muted" />
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 bg-background/90 text-[10px] font-bold px-1.5 rounded-tl">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center text-sm font-medium text-muted-foreground">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <Link href={`/orders/${order.id}`}>
                  <Button variant="outline" className="shrink-0 gap-2">
                    View Details <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {isRejected && (
                <ResubmitPanel order={ext} onDone={handleResubmitDone} />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
