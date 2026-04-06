import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Track from "./pages/Track";
import TrackerHome from "./pages/tracker/TrackerHome";
import TrackerAdmin from "./pages/tracker/AdminPanel";

// Dashboard pages
import DashboardLayout from "./components/DashboardLayout";
import AgentDashboard from "./pages/AgentDashboard";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminAgentsPage from "./pages/AdminAgentsPage";
import AdminAgentsManagement from "./pages/AdminAgentsManagement";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  if (adminOnly && user.role !== "admin") {
    window.location.href = "/dashboard";
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/track" component={Track} />
      <Route path="/tracker" component={TrackerHome} />
      <Route path="/tracker/admin" component={TrackerAdmin} />

      {/* Agent routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <AgentDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute>
          <DashboardLayout>
            <OrdersPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders/new">
        <ProtectedRoute>
          <DashboardLayout>
            <OrderFormPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/orders/:id/edit">
        {(params) => (
          <ProtectedRoute>
            <DashboardLayout>
              <OrderFormPage orderId={Number(params.id)} />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute adminOnly>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/orders">
        <ProtectedRoute adminOnly>
          <DashboardLayout>
            <AdminOrdersPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/agents">
        <ProtectedRoute adminOnly>
          <DashboardLayout>
            <AdminAgentsManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Profile */}
      <Route path="/profile">
        <ProtectedRoute>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
