import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Roles: admin (full access) | agent (dropshipper, own orders only) | user (default)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "agent"]).default("agent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Orders table — each order belongs to an agent (userId).
 * Admins can view and edit all orders; agents can only see their own.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),

  // Agent who created the order
  agentId: int("agentId").notNull(),

  // Customer details
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 32 }).notNull(),
  customerAddress: text("customerAddress").notNull(),

  // Product details
  productName: varchar("productName", { length: 255 }).notNull(),
  productSize: varchar("productSize", { length: 64 }),
  quantity: int("quantity").default(1).notNull(),
  productPrice: decimal("productPrice", { precision: 10, scale: 2 }).default("0"),
  orderValue: decimal("orderValue", { precision: 10, scale: 2 }).default("0"),
  productImageUrl: text("productImageUrl"),

  // Aadhaar verification documents (S3 URLs)
  aadhaarFrontUrl: text("aadhaarFrontUrl"),
  aadhaarBackUrl: text("aadhaarBackUrl"),

  // Payment & cashback
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid"]).default("unpaid").notNull(),
  cashback: decimal("cashback", { precision: 10, scale: 2 }).default("0"),

  // Order status
  orderStatus: mysqlEnum("orderStatus", ["processing", "shipped", "delivered", "cancelled"])
    .default("processing")
    .notNull(),

  // Shipping
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  origin: varchar("origin", { length: 128 }),
  destination: varchar("destination", { length: 128 }),

  // Additional notes
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Shipment tracking events for an order.
 */
export const orderTraces = mysqlTable("order_traces", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  location: varchar("location", { length: 255 }),
  tracedAt: timestamp("tracedAt").defaultNow().notNull(),
});

export type OrderTrace = typeof orderTraces.$inferSelect;
export type InsertOrderTrace = typeof orderTraces.$inferInsert;
