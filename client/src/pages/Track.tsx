import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/orderUtils";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const STATUS_STEPS = ["processing", "shipped", "delivered"] as const;

function getStepIndex(status: string) {
  if (status === "delivered") return 2;
  if (status === "shipped") return 1;
  return 0;
}

// Demo data for when no real order is found
const DEMO_TRACKING = {
  orderNo: "PBW-240301-DEMO",
  trackingNumber: "TRKPBW240301",
  origin: "Delhi",
  destination: "Gurugram",
  orderStatus: "shipped",
  traces: [
    { description: "Order placed and confirmed", location: "Delhi", time: new Date(Date.now() - 86400000 * 3) },
    { description: "Package picked up by courier", location: "Delhi Hub", time: new Date(Date.now() - 86400000 * 2) },
    { description: "In transit to destination city", location: "NH-48 Highway", time: new Date(Date.now() - 86400000) },
    { description: "Out for delivery", location: "Gurugram", time: new Date(Date.now() - 3600000) },
  ],
};

export default function Track() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const { data: result, isLoading, error } = trpc.tracking.lookup.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowDemo(false);
    setSearchQuery(query.trim());
  };

  const trackingData = result ?? (showDemo ? DEMO_TRACKING : null);
  const stepIndex = trackingData ? getStepIndex(trackingData.orderStatus) : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PBW Dropshipper Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Home
            </Button>
            <Button size="sm" onClick={() => setLocation("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Track Your Shipment</h1>
            <p className="text-muted-foreground">
              Enter your order number or tracking ID to get real-time updates.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter order no. (PBW-...) or tracking ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
            <Button type="submit" className="h-11 px-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
            </Button>
          </form>

          <div className="text-center mb-8">
            <button
              type="button"
              onClick={() => { setShowDemo(true); setSearchQuery(""); }}
              className="text-sm text-primary hover:underline"
            >
              Try a demo shipment →
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Not found */}
          {searchQuery && !isLoading && result === null && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 text-center">
                <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">No shipment found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No order or tracking ID matching "{searchQuery}" was found.
                  Please check and try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tracking result */}
          {trackingData && !isLoading && (
            <div className="space-y-6">
              {/* Order summary */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order Number</p>
                      <CardTitle className="font-mono text-lg">{trackingData.orderNo}</CardTitle>
                      {trackingData.trackingNumber && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tracking ID: <span className="font-mono">{trackingData.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                    <span className={`badge-status ${
                      trackingData.orderStatus === "delivered" ? "badge-delivered" :
                      trackingData.orderStatus === "shipped" ? "badge-shipped" :
                      trackingData.orderStatus === "cancelled" ? "badge-cancelled" :
                      "badge-processing"
                    } capitalize`}>
                      {trackingData.orderStatus}
                    </span>
                  </div>
                </CardHeader>
                {(trackingData.origin || trackingData.destination) && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{trackingData.origin ?? "—"}</span>
                      <span className="mx-1">→</span>
                      <span>{trackingData.destination ?? "—"}</span>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Progress steps */}
              {trackingData.orderStatus !== "cancelled" && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between relative">
                      {/* Progress line */}
                      <div className="absolute left-0 right-0 top-5 h-0.5 bg-border mx-10" />
                      <div
                        className="absolute left-0 top-5 h-0.5 bg-primary mx-10 transition-all"
                        style={{ width: `${(stepIndex / 2) * 100}%` }}
                      />
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        const active = i === stepIndex;
                        return (
                          <div key={step} className="flex flex-col items-center gap-2 z-10">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                done
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-background border-border text-muted-foreground"
                              } ${active ? "ring-4 ring-primary/20" : ""}`}
                            >
                              {done ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <span className="text-xs font-medium">{i + 1}</span>
                              )}
                            </div>
                            <span className={`text-xs font-medium capitalize ${done ? "text-primary" : "text-muted-foreground"}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trace timeline */}
              {trackingData.traces && trackingData.traces.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Shipment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative">
                      {trackingData.traces.map((trace: any, i: number) => (
                        <div key={i} className="flex gap-4 px-6 py-4 border-b last:border-0">
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            <div className={`h-3 w-3 rounded-full border-2 ${
                              i === 0 ? "bg-primary border-primary" : "bg-background border-border"
                            }`} />
                            {i < trackingData.traces.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border min-h-[20px]" />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <p className="font-medium text-sm">{trace.description}</p>
                            {trace.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{trace.location}</span>
                              </div>
                            )}
                            {trace.time && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(trace.time)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Demo notice */}
              {showDemo && (
                <p className="text-center text-xs text-muted-foreground">
                  This is demo data. Enter a real order number above to track an actual shipment.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
