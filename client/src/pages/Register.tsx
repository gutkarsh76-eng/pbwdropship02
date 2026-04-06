import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { createUser, setCurrentUser, findUserByEmail } from "@/lib/auth";

export default function Register() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError("Password must contain uppercase, lowercase, number, and special character (@$!%*?&)");
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists
      if (findUserByEmail(email)) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      // Create new user
      const newUser = createUser(email, name, password, "agent");
      
      // Auto-login
      setCurrentUser({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
      
      toast.success("Account created successfully!");
      
      // Redirect to dashboard
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      toast.error(err.message || "Registration failed");
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
            Join PBW Dropshippers
          </h1>
          <p className="opacity-80 leading-relaxed mb-8">
            Create your agent account and start managing your PBW dropshipping business from one unified platform.
          </p>
          <div className="space-y-3">
            {[
              "Dedicated agent dashboard",
              "Real-time order management",
              "Aadhaar document management",
              "Cashback and payment tracking",
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
            <h2 className="text-2xl font-bold">Create your account</h2>
            <p className="text-muted-foreground mt-1">Register as a PBW dropshipper agent</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

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
                placeholder="Create a password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Must contain uppercase, lowercase, number, and special character (@$!%*?&)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              Sign in
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
