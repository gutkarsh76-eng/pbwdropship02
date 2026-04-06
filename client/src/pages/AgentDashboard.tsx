import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, paymentBadgeClass, statusBadgeClass } from "@/lib/orderUtils";
import { BarChart3, CheckCircle2, CreditCard, Package, Plus, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.orders.myStats.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery();

  const recentOrders = orders?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.name?.split(" ")[0] ?? "Agent"}
          </p>
        </div>
        <Button onClick={() => setLocation("/orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ShoppingBag}
          label="Total Orders"
          value={statsLoading ? "—" : String(stats?.totalOrders ?? 0)}
          description="Orders you have created"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Paid Orders"
          value={statsLoading ? "—" : String(stats?.paidOrders ?? 0)}
          description="Orders marked as paid"
          color="green"
        />
        <MetricCard
          icon={BarChart3}
          label="Revenue"
          value={statsLoading ? "—" : formatCurrency(stats?.totalRevenue)}
          description="Combined order value"
          color="blue"
        />
        <MetricCard
          icon={CreditCard}
          label="Cashback"
          value={statsLoading ? "—" : formatCurrency(stats?.totalCashback)}
          description="Assigned by PBW admin"
          color="amber"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Latest activity from your account</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/orders")}>
            View all →
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet.</p>
              <Button className="mt-4" size="sm" onClick={() => setLocation("/orders/new")}>
                Create your first order
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order No.</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate">{order.productName}</td>
                      <td className="px-4 py-3">
                        <span className={statusBadgeClass(order.orderStatus)}>{order.orderStatus}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/orders/${order.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickActionCard
          icon={Plus}
          title="Create New Order"
          description="Add a new customer order with product and payment details"
          onClick={() => setLocation("/orders/new")}
        />
        <QuickActionCard
          icon={Package}
          title="View All Orders"
          description="See all your orders, filter by status or payment"
          onClick={() => setLocation("/orders")}
        />
        <QuickActionCard
          icon={BarChart3}
          title="Track Shipment"
          description="Check live shipment updates for any order"
          onClick={() => setLocation("/track")}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  color = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  color?: "default" | "green" | "blue" | "amber";
}) {
  const colorMap = {
    default: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </button>
  );
}
