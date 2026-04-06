import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileBadge2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    icon: ShoppingBag,
    title: "Create and track orders in real time",
    text: "Manage order capture, visibility, and customer details from one PBW workspace.",
  },
  {
    icon: FileBadge2,
    title: "Upload Aadhaar verification documents",
    text: "Keep verification context with each order instead of splitting it across chats.",
  },
  {
    icon: CreditCard,
    title: "Monitor cashback and payment status",
    text: "See what is paid, pending, and assigned by admin without extra spreadsheets.",
  },
  {
    icon: Truck,
    title: "Offer live shipment tracking",
    text: "Publish shipment updates on a customer-facing tracker using order or tracking ID.",
  },
];

const workflow = [
  "Create your agent account and sign in to the PBW workspace.",
  "Submit new orders with customer, payment, and verification details.",
  "Track statuses while admins assign cashback and shipment data.",
  "Share the public tracking page with customers for live updates.",
];

/**
 * Returns a deterministic pseudo-random integer in [min, max] that changes
 * every `intervalHours` hours. The value is stable for the entire interval
 * so all visitors see the same number at the same time.
 */
function getRotatingValue(min: number, max: number, intervalHours: number): number {
  const slot = Math.floor(Date.now() / (intervalHours * 60 * 60 * 1000));
  // Simple LCG hash of the slot index
  const hash = ((slot * 1664525 + 1013904223) >>> 0) % (max - min + 1);
  return min + hash;
}

export default function Landing() {
  const [, setLocation] = useLocation();

  // Rotates between 17 and 45 every 4 hours
  const liveShipments = useMemo(() => getRotatingValue(17, 45, 4), []);

  const stats = [
    { icon: Package, value: "1500+", label: "Orders managed" },
    { icon: Truck, value: String(liveShipments), label: "Live shipments" },
    { icon: CreditCard, value: "₹675k", label: "Cashback assigned" },
    { icon: ShieldCheck, value: "100%", label: "Aadhaar verified" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-sm">PBW</span>
              <span className="text-muted-foreground text-sm ml-1 hidden sm:inline">Dropshipper Portal</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground transition-colors">Workflow</a>
            <button onClick={() => window.open("/tracker", "_blank")} className="text-muted-foreground hover:text-foreground transition-colors">Track Order</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/login")}>Sign In</Button>
            <Button size="sm" onClick={() => setLocation("/register")}>Get Started</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium mb-6">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Dropshipper Management Platform
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
                  Manage PBW Dropshipping{" "}
                  <span className="text-primary">Orders with Ease</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Streamline your entire order management workflow with a dedicated platform
                  for orders, verification, shipment tracking, payments, and cashback visibility.
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Button size="lg" onClick={() => setLocation("/register")}>
                    Start Managing Orders
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => window.open("/tracker", "_blank")}>
                    <Truck className="mr-2 h-4 w-4" />
                    Track a Shipment
                  </Button>
                </div>
                <div className="flex flex-wrap gap-6">
                  {[
                    { value: "24/7", label: "Order visibility" },
                    { value: "100%", label: "Dropshipper-focused" },
                    { value: "1", label: "Unified workspace" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero panel */}
              <div className="relative">
                <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
                  <div className="grid grid-cols-2 gap-px bg-border">
                    {stats.map((stat) => (
                      <div key={stat.label} className="bg-card p-4">
                        <stat.icon className="h-4 w-4 text-primary mb-2" />
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-primary/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-muted/30" id="features">
          <div className="container">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">Platform Features</p>
              <h2 className="text-3xl font-bold mb-4">Built for ProBadmintonWorld.com dropshippers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your dropshipping business — from order creation
                to customer verification and live shipment tracking.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2 leading-snug">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-20" id="workflow">
          <div className="container">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">Workflow</p>
              <h2 className="text-3xl font-bold">From registration to fulfillment</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {workflow.map((step, i) => (
                <div key={step} className="flex flex-col items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <p className="text-sm font-medium opacity-80 uppercase tracking-wide mb-3">Start managing orders</p>
            <h2 className="text-3xl font-bold mb-4">
              Move PBW dropshipping out of scattered chats and sheets.
            </h2>
            <p className="opacity-80 mb-8 max-w-xl mx-auto">
              Join the PBW Dropshipper Portal and manage all your orders, customers, and shipments in one place.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setLocation("/register")}
              >
                Create Account
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span>PBW Dropshipper Portal. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setLocation("/login")} className="hover:text-foreground transition-colors">Login</button>
            <button onClick={() => setLocation("/register")} className="hover:text-foreground transition-colors">Register</button>
            <button onClick={() => window.open("/tracker", "_blank")} className="hover:text-foreground transition-colors">Track Order</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
