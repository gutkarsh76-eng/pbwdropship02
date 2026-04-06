import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/orderUtils";
import {
  ChevronLeft,
  FileBadge2,
  Loader2,
  MapPin,
  Package,
  Plus,
  Trash2,
  Truck,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Trace = { description: string; location: string };

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productSize: string;
  quantity: number;
  productPrice: number;
  orderValue: number;
  productImageUrl: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
  paymentStatus: "unpaid" | "paid";
  cashback: number;
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled";
  trackingNumber: string;
  origin: string;
  destination: string;
  notes: string;
  traces: Trace[];
}

function emptyForm(): OrderFormData {
  return {
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    productName: "",
    productSize: "",
    quantity: 1,
    productPrice: 0,
    orderValue: 0,
    productImageUrl: "",
    aadhaarFrontUrl: "",
    aadhaarBackUrl: "",
    paymentStatus: "unpaid",
    cashback: 0,
    orderStatus: "processing",
    trackingNumber: "",
    origin: "",
    destination: "",
    notes: "",
    traces: [],
  };
}

export default function OrderFormPage({ orderId }: { orderId?: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";
  const isEdit = !!orderId;

  const { data: existingOrder, isLoading: loadingOrder } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: isEdit }
  );

  const [form, setForm] = useState<OrderFormData>(emptyForm());
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const createMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Order created successfully");
      utils.orders.myOrders.invalidate();
      setLocation("/orders");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order updated successfully");
      utils.orders.myOrders.invalidate();
      if (isAdmin) {
        utils.admin.allOrders.invalidate();
        setLocation("/admin/orders");
      } else {
        setLocation("/orders");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const uploadMutation = trpc.upload.uploadFile.useMutation();

  // Populate form when editing
  useEffect(() => {
    if (existingOrder) {
      setForm({
        customerName: existingOrder.customerName,
        customerPhone: existingOrder.customerPhone,
        customerAddress: existingOrder.customerAddress,
        productName: existingOrder.productName,
        productSize: existingOrder.productSize ?? "",
        quantity: existingOrder.quantity,
        productPrice: Number(existingOrder.productPrice ?? 0),
        orderValue: Number(existingOrder.orderValue ?? 0),
        productImageUrl: existingOrder.productImageUrl ?? "",
        aadhaarFrontUrl: existingOrder.aadhaarFrontUrl ?? "",
        aadhaarBackUrl: existingOrder.aadhaarBackUrl ?? "",
        paymentStatus: existingOrder.paymentStatus,
        cashback: Number(existingOrder.cashback ?? 0),
        orderStatus: existingOrder.orderStatus,
        trackingNumber: existingOrder.trackingNumber ?? "",
        origin: existingOrder.origin ?? "",
        destination: existingOrder.destination ?? "",
        notes: existingOrder.notes ?? "",
        traces: (existingOrder.traces ?? []).map((t: any) => ({
          description: t.description,
          location: t.location ?? "",
        })),
      });
    }
  }, [existingOrder]);

  const updateField = <K extends keyof OrderFormData>(key: K, value: OrderFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (
    field: "aadhaarFrontUrl" | "aadhaarBackUrl" | "productImageUrl",
    file: File,
    folder: "aadhaar" | "product"
  ) => {
    setUploadingField(field);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const key = `${folder}/${Date.now()}-${file.name}`;
      const { url } = await uploadMutation.mutateAsync({
        key,
        base64Data,
        contentType: file.type,
      });
      updateField(field, url);
      toast.success("File uploaded successfully");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      traces: form.traces.filter((t) => t.description.trim()),
    };
    if (isEdit) {
      updateMutation.mutate({ id: orderId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingOrder) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => setLocation(isAdmin ? "/admin/orders" : "/orders")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold">{isEdit ? "Edit Order" : "Create Order"}</h1>
          {isEdit && existingOrder && (
            <p className="text-sm text-muted-foreground mt-0.5">Order #{existingOrder.orderNo}</p>
          )}
        </div>
      </div>

      {/* Product Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                required
                placeholder="e.g. Yonex Astrox 99"
                value={form.productName}
                onChange={(e) => updateField("productName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="productSize">Size / Variant</Label>
              <Input
                id="productSize"
                placeholder="e.g. 4U, G5"
                value={form.productSize}
                onChange={(e) => updateField("productSize", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                required
                value={form.quantity}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
              />
            </div>

            {/* Price — admin only */}
            {isAdmin ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="productPrice">Product Price (₹)</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    min={0}
                    value={form.productPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateField("productPrice", v);
                      updateField("orderValue", v);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orderValue">Order Value (₹)</Label>
                  <Input
                    id="orderValue"
                    type="number"
                    min={0}
                    value={form.orderValue}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateField("orderValue", v);
                      updateField("productPrice", v);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Syncs with Product Price</p>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Product Price (set by admin)</Label>
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                  {form.productPrice > 0 ? formatCurrency(form.productPrice) : "Not set yet"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">This price is synced with Order Value</p>
              </div>
            )}
          </div>

          {/* Product image upload */}
          <div className="space-y-1.5">
            <Label>Product Image</Label>
            <ImageUploadField
              value={form.productImageUrl}
              onUpload={(file) => handleFileUpload("productImageUrl", file, "product")}
              onRemove={() => updateField("productImageUrl", "")}
              uploading={uploadingField === "productImageUrl"}
              label="Upload product image"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                required
                placeholder="Full name"
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                required
                placeholder="+91 98765 43210"
                value={form.customerPhone}
                onChange={(e) => updateField("customerPhone", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="customerAddress">Delivery Address *</Label>
              <Textarea
                id="customerAddress"
                required
                placeholder="Full delivery address"
                rows={3}
                value={form.customerAddress}
                onChange={(e) => updateField("customerAddress", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aadhaar Upload */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileBadge2 className="h-4 w-4" />
            Aadhaar Card Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Front Side</Label>
              <ImageUploadField
                value={form.aadhaarFrontUrl}
                onUpload={(file) => handleFileUpload("aadhaarFrontUrl", file, "aadhaar")}
                onRemove={() => updateField("aadhaarFrontUrl", "")}
                uploading={uploadingField === "aadhaarFrontUrl"}
                label="Upload front side"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Back Side</Label>
              <ImageUploadField
                value={form.aadhaarBackUrl}
                onUpload={(file) => handleFileUpload("aadhaarBackUrl", file, "aadhaar")}
                onRemove={() => updateField("aadhaarBackUrl", "")}
                uploading={uploadingField === "aadhaarBackUrl"}
                label="Upload back side"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Status — admin fields */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            Payment & Order Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Product Price (₹)</Label>
              {isAdmin ? (
                <Input
                  type="number"
                  min={0}
                  value={form.productPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateField("productPrice", v);
                    updateField("orderValue", v);
                  }}
                />
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                  {form.productPrice > 0 ? formatCurrency(form.productPrice) : "Not set yet"}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              {isAdmin ? (
                <Select
                  value={form.paymentStatus}
                  onValueChange={(v) => updateField("paymentStatus", v as "unpaid" | "paid")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm capitalize">
                  {form.paymentStatus}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Order Status</Label>
              {isAdmin ? (
                <Select
                  value={form.orderStatus}
                  onValueChange={(v) =>
                    updateField("orderStatus", v as "processing" | "shipped" | "delivered" | "cancelled")
                  }
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
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm capitalize">
                  {form.orderStatus}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Cashback (₹)</Label>
              {isAdmin ? (
                <Input
                  type="number"
                  min={0}
                  value={form.cashback}
                  onChange={(e) => updateField("cashback", Number(e.target.value))}
                />
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                  {form.cashback > 0 ? formatCurrency(form.cashback) : "Not assigned yet"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping — admin only */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Shipping Information
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open("/tracker", "_blank")}
            className="gap-2"
          >
            <Truck className="h-4 w-4" />
            Track Order
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tracking Number</Label>
              {isAdmin ? (
                <Input
                  placeholder="e.g. TRKPBW240301"
                  value={form.trackingNumber}
                  onChange={(e) => updateField("trackingNumber", e.target.value)}
                />
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm font-mono">
                  {form.trackingNumber || "Not assigned yet"}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Origin</Label>
              {isAdmin ? (
                <Input
                  placeholder="e.g. Delhi"
                  value={form.origin}
                  onChange={(e) => updateField("origin", e.target.value)}
                />
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                  {form.origin || "—"}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              {isAdmin ? (
                <Input
                  placeholder="e.g. Gurugram"
                  value={form.destination}
                  onChange={(e) => updateField("destination", e.target.value)}
                />
              ) : (
                <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-muted-foreground text-sm">
                  {form.destination || "—"}
                </div>
              )}
            </div>
          </div>

          {/* Tracking traces — admin only */}
          {isAdmin && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Shipment Traces</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateField("traces", [...form.traces, { description: "", location: "" }])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Trace
                </Button>
              </div>
              {form.traces.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tracking events added yet.</p>
              ) : (
                <div className="space-y-2">
                  {form.traces.map((trace, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Description"
                          value={trace.description}
                          onChange={(e) => {
                            const updated = [...form.traces];
                            updated[i] = { ...updated[i], description: e.target.value };
                            updateField("traces", updated);
                          }}
                        />
                        <Input
                          placeholder="Location (optional)"
                          value={trace.location}
                          onChange={(e) => {
                            const updated = [...form.traces];
                            updated[i] = { ...updated[i], location: e.target.value };
                            updateField("traces", updated);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => {
                          updateField("traces", form.traces.filter((_, idx) => idx !== i));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special instructions or notes for this order..."
            rows={3}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation(isAdmin ? "/admin/orders" : "/orders")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}

function ImageUploadField({
  value,
  onUpload,
  onRemove,
  uploading,
  label,
}: {
  value: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (value) {
    return (
      <div className="relative rounded-lg border overflow-hidden group">
        <img src={value} alt="Uploaded" className="w-full h-40 object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer">
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </label>
  );
}
