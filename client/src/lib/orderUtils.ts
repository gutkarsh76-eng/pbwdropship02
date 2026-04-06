export function formatCurrency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export function statusBadgeClass(status: OrderStatus | string): string {
  switch (status) {
    case "delivered": return "badge-status badge-delivered";
    case "shipped":   return "badge-status badge-shipped";
    case "processing": return "badge-status badge-processing";
    case "cancelled": return "badge-status badge-cancelled";
    default:          return "badge-status badge-processing";
  }
}

export function paymentBadgeClass(status: PaymentStatus | string): string {
  return status === "paid" ? "badge-status badge-paid" : "badge-status badge-unpaid";
}

export const ORDER_STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "shipped",    label: "Shipped" },
  { value: "delivered",  label: "Delivered" },
  { value: "cancelled",  label: "Cancelled" },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid",   label: "Paid" },
] as const;
