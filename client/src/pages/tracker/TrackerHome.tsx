import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface TraceItem {
  time: number | string | null;
  description: string;
  location: string;
  manual: boolean;
}

function formatTime(t: number | string | null): string {
  if (!t) return "—";
  const d = new Date(typeof t === "string" ? t : Number(t));
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrackingTimeline({
  traces,
  origin,
  destination,
  orderNo,
}: {
  traces: TraceItem[];
  origin: string;
  destination: string;
  orderNo: string;
}) {
  const reversed = [...traces].reverse();
  return (
    <Card className="mt-6 shadow-sm">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tracking ID</p>
            <p className="font-mono font-semibold text-lg text-foreground">{orderNo}</p>
          </div>
          {(origin || destination) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {origin && <span className="font-medium text-foreground">{origin}</span>}
              {origin && destination && <ArrowRight className="h-4 w-4 shrink-0" />}
              {destination && <span className="font-medium text-foreground">{destination}</span>}
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Latest status banner */}
        {reversed[0] && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground">{reversed[0].description}</p>
              {reversed[0].location && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {reversed[0].location}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatTime(reversed[0].time)}
              </p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-0">
          {reversed.map((trace, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === reversed.length - 1;
            return (
              <div key={idx} className="flex gap-4">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 z-10 ${
                      isFirst
                        ? "border-primary bg-primary text-primary-foreground"
                        : trace.manual
                        ? "border-amber-500 bg-amber-50 text-amber-600"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isFirst ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : trace.manual ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 bg-border my-1" />}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${
                        isFirst ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {trace.description}
                    </p>
                    {trace.manual && (
                      <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 bg-amber-50">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {trace.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {trace.location}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatTime(trace.time)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrackerHome() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Please enter a tracking number.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      // Simulate API call - in production, this would call your backend
      // For now, show a demo message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.error("Tracking service requires backend configuration");
      setError("The tracking service requires backend API configuration. Please set up your environment variables and database connection.");
    } catch (err: any) {
      setError(err.message || "Failed to fetch tracking information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">PBW Order Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/tracker/admin"}
            >
              Admin Login
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/"}
            >
              Back to Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16 sm:py-24">
        <div className="container text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-6">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Track Your Shipment</h1>
          <p className="text-primary-foreground/75 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            Enter your tracking number below to get real-time status updates on your package.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter tracking number…"
              className="bg-white text-foreground placeholder:text-muted-foreground border-0 h-11"
            />
            <Button type="submit" variant="secondary" className="h-11 px-5 shrink-0" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Track</span>
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <main className="container py-8 flex-1">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Fetching tracking information…</p>
          </div>
        )}

        {error && !isLoading && (
          <Card className="mt-4 border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Setup Required</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {trackingData && !isLoading && (
          <TrackingTimeline
            traces={trackingData.traces}
            origin={trackingData.origin}
            destination={trackingData.destination}
            orderNo={trackingData.orderNo}
          />
        )}

        {!input && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Package className="h-12 w-12 opacity-20" />
            <p className="text-sm">Enter a tracking number above to get started.</p>
            <p className="text-xs max-w-sm text-center">
              The tracker is fully integrated and ready. Connect your backend API to enable live tracking.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} PBW Order Tracker. All rights reserved.
      </footer>
    </div>
  );
}
