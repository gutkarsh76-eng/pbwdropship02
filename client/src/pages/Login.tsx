import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        toast.error(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Store user in localStorage for frontend state
      localStorage.setItem("user", JSON.stringify(data.user));
      
      toast.success("Login successful!");
      
      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast.error(err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left aside */}
      <aside className="hidden lg:flex flex-col justify-between w-[420px] bg-primary text-primary-foreground p-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 rounded-md bg-primary-foreground/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold">PBW Dropshipper Portal</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-4">
            Welcome back to PBW Dropshippers
          </h1>
          <p className="opacity-80 leading-relaxed mb-8">
            Sign in to manage your orders, track shipments, and monitor your cashback in one place.
          </p>
          <div className="space-y-3">
            {[
              "Create and track orders in real time",
              "Upload Aadhaar verification documents",
              "Monitor cashback and payment status",
              "Get full visibility from your dashboard",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 opacity-80 shrink-0" />
                <span className="opacity-90">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs opacity-50">© {new Date().getFullYear()} PBW Dropshippers. All rights reserved.</p>
      </aside>

      {/* Right main */}
      <main className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PBW Dropshipper Portal</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="text-muted-foreground mt-1">Enter your credentials to access the portal</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Create one
            </button>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <button
              onClick={() => setLocation("/")}
              className="hover:underline"
              disabled={loading}
            >
              ← Back to home
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
