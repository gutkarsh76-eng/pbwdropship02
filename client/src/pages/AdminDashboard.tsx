import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, statusBadgeClass, paymentBadgeClass, formatDate } from "@/lib/orderUtils";
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const { data: recentOrders } = trpc.admin.recentOrders.useQuery();
  const { data: agentStats } = trpc.admin.agentStats.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System-wide metrics and activity</p>
        </div>
        <Button onClick={() => setLocation("/admin/orders")}>
          Manage Orders
        </Button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ShoppingBag}
          label="Total Orders"
          value={isLoading ? "—" : String(stats?.totalOrders ?? 0)}
          description="Across all agents"
        />
        <MetricCard
          icon={Users}
          label="Active Agents"
          value={isLoading ? "—" : String(stats?.totalAgents ?? 0)}
          description="Registered dropshippers"
          color="blue"
        />
        <MetricCard
          icon={BarChart3}
          label="Total Revenue"
          value={isLoading ? "—" : formatCurrency(stats?.totalRevenue)}
          description="Combined order value"
          color="green"
        />
        <MetricCard
          icon={CreditCard}
          label="Total Cashback"
          value={isLoading ? "—" : formatCurrency(stats?.totalCashback)}
          description="Assigned to agents"
          color="amber"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Package}
          label="Processing"
          value={isLoading ? "—" : String(stats?.byStatus?.processing ?? 0)}
          description="Orders in processing"
          color="amber"
        />
        <MetricCard
          icon={Truck}
          label="Shipped"
          value={isLoading ? "—" : String(stats?.byStatus?.shipped ?? 0)}
          description="Orders in transit"
          color="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Delivered"
          value={isLoading ? "—" : String(stats?.byStatus?.delivered ?? 0)}
          description="Completed orders"
          color="green"
        />
        <MetricCard
          icon={CreditCard}
          label="Paid Orders"
          value={isLoading ? "—" : String(stats?.paidOrders ?? 0)}
          description="Payment confirmed"
          color="green"
        />
      </div>

      {/* Charts + Recent Orders */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent performance chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Agent Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {agentStats && agentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agentStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No agent data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Processing", key: "processing", color: "bg-amber-500" },
              { label: "Shipped", key: "shipped", color: "bg-blue-500" },
              { label: "Delivered", key: "delivered", color: "bg-green-500" },
              { label: "Cancelled", key: "cancelled", color: "bg-red-500" },
            ].map(({ label, key, color }) => {
              const count = stats?.byStatus?.[key as keyof typeof stats.byStatus] ?? 0;
              const total = stats?.totalOrders ?? 1;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Latest orders across all agents</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/orders")}>
            View all →
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order No.</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Agent</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNo}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{order.agentName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
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
