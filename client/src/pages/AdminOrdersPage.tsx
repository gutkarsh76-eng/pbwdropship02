import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, paymentBadgeClass, statusBadgeClass } from "@/lib/orderUtils";
import { Package, Search, Settings, Truck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Order = {
  id: number;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productSize?: string | null;
  orderValue?: string | null;
  orderStatus: string;
  paymentStatus: string;
  cashback?: string | null;
  trackingNumber?: string | null;
  createdAt: Date;
  agentId: number;
};

export default function AdminOrdersPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    orderStatus: "processing",
    paymentStatus: "unpaid",
    cashback: 0,
    trackingNumber: "",
    productPrice: 0,
    orderValue: 0,
    origin: "",
    destination: "",
  });

  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.admin.allOrders.useQuery();
  const updateMutation = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast.success("Order updated and agent notified");
      utils.admin.allOrders.invalidate();
      utils.admin.stats.invalidate();
      setEditOrder(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (orders ?? []).filter((order: any) => {
    const matchSearch =
      !search ||
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (order.productName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    const matchPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const openEdit = (order: Order) => {
    setEditOrder(order);
    setEditForm({
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      cashback: Number(order.cashback ?? 0),
      trackingNumber: order.trackingNumber ?? "",
      productPrice: 0,
      orderValue: Number(order.orderValue ?? 0),
      origin: "",
      destination: "",
    });
  };

  const handleSave = () => {
    if (!editOrder) return;
    updateMutation.mutate({
      id: editOrder.id,
      orderStatus: editForm.orderStatus as "processing" | "shipped" | "delivered" | "cancelled",
      paymentStatus: editForm.paymentStatus as "unpaid" | "paid",
      cashback: editForm.cashback,
      trackingNumber: editForm.trackingNumber,
      productPrice: editForm.productPrice,
      orderValue: editForm.orderValue,
      origin: editForm.origin,
      destination: editForm.destination,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">All Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage orders across all agents
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order No.</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cashback</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNo}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[140px] truncate">{order.productName}</p>
                      {order.productSize && (
                        <p className="text-xs text-muted-foreground">{order.productSize}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(order.orderValue)}</td>
                    <td className="px-4 py-3">
                      <span className={statusBadgeClass(order.orderStatus)}>{order.orderStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={paymentBadgeClass(order.paymentStatus)}>{order.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {Number(order.cashback) > 0 ? (
                        <span className="text-green-600 font-medium">{formatCurrency(order.cashback)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.trackingNumber ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(order)}
                        >
                          <Settings className="h-3.5 w-3.5 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/orders/${order.id}/edit`)}
                        >
                          Full Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {orders?.length ?? 0} orders
        </p>
      )}

      {/* Quick Edit Dialog */}
      <Dialog open={!!editOrder} onOpenChange={(open) => !open && setEditOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Order: {editOrder?.orderNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Order Status</Label>
                <Select
                  value={editForm.orderStatus}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, orderStatus: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Select
                  value={editForm.paymentStatus}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, paymentStatus: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cashback (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.cashback}
                  onChange={(e) => setEditForm((f) => ({ ...f, cashback: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Order Value (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.orderValue}
                  onChange={(e) => setEditForm((f) => ({ ...f, orderValue: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tracking Number</Label>
              <Input
                placeholder="e.g. TRKPBW240301"
                value={editForm.trackingNumber}
                onChange={(e) => setEditForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Origin</Label>
                <Input
                  placeholder="e.g. Delhi"
                  value={editForm.origin}
                  onChange={(e) => setEditForm((f) => ({ ...f, origin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input
                  placeholder="e.g. Gurugram"
                  value={editForm.destination}
                  onChange={(e) => setEditForm((f) => ({ ...f, destination: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The agent will be notified automatically when status, cashback, or tracking changes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => window.open("/tracker", "_blank")}
            >
              <Truck className="h-4 w-4 mr-2" />
              Track Order
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
