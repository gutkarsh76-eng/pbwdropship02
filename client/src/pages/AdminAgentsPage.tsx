import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/orderUtils";
import { Users, Package, CreditCard, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminAgentsPage() {
  const { data: agents, isLoading } = trpc.admin.allAgents.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All registered dropshipper agents and their performance
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Loading agents...</div>
      ) : !agents || agents.length === 0 ? (
        <div className="p-12 text-center rounded-lg border bg-card">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No agents registered yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agents will appear here once they register and are assigned the agent role.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent: any) => {
            const initials = agent.name
              ? agent.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            return (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  {/* Agent header */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{agent.name ?? "Unnamed Agent"}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.email ?? "No email"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {formatDate(agent.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Orders</span>
                      </div>
                      <p className="text-lg font-bold">{agent.totalOrders ?? 0}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Paid</span>
                      </div>
                      <p className="text-lg font-bold">{agent.paidOrders ?? 0}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(agent.totalRevenue)}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs text-muted-foreground">Cashback</span>
                      </div>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(agent.totalCashback)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
