import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertOrder, InsertOrderTrace, orders, orderTraces, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "phone"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, 'agent')).orderBy(desc(users.createdAt));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserProfile(id: number, data: { name?: string; phone?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function generateOrderNo(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PBW-${year}${month}${day}-${rand}`;
}

export async function createOrder(data: Omit<InsertOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const orderNo = generateOrderNo();
  await db.insert(orders).values({ ...data, orderNo });
  const result = await db.select().from(orders).where(eq(orders.orderNo, orderNo)).limit(1);
  return result[0];
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id));
  return getOrderById(id);
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByAgent(agentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.agentId, agentId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orderTraces).where(eq(orderTraces.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

export async function getOrderByTrackingOrOrderNo(query: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders)
    .where(sql`${orders.trackingNumber} = ${query} OR ${orders.orderNo} = ${query}`)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Order Traces ─────────────────────────────────────────────────────────────

export async function addOrderTrace(data: Omit<InsertOrderTrace, 'id' | 'tracedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderTraces).values(data);
}

export async function getOrderTraces(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderTraces)
    .where(eq(orderTraces.orderId, orderId))
    .orderBy(desc(orderTraces.tracedAt));
}

export async function deleteOrderTraces(orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(orderTraces).where(eq(orderTraces.orderId, orderId));
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return {
    totalOrders: 0, totalAgents: 0, inTransit: 0, totalCashback: 0, totalRevenue: 0,
    paidOrders: 0,
    byStatus: { processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
  };

  const [orderStats] = await db.select({
    totalOrders: sql<number>`COUNT(*)`,
    inTransit: sql<number>`SUM(CASE WHEN ${orders.orderStatus} = 'shipped' THEN 1 ELSE 0 END)`,
    totalCashback: sql<number>`SUM(CAST(${orders.cashback} AS DECIMAL(10,2)))`,
    totalRevenue: sql<number>`SUM(CAST(${orders.orderValue} AS DECIMAL(10,2)))`,
    paidOrders: sql<number>`SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 ELSE 0 END)`,
    processing: sql<number>`SUM(CASE WHEN ${orders.orderStatus} = 'processing' THEN 1 ELSE 0 END)`,
    shipped: sql<number>`SUM(CASE WHEN ${orders.orderStatus} = 'shipped' THEN 1 ELSE 0 END)`,
    delivered: sql<number>`SUM(CASE WHEN ${orders.orderStatus} = 'delivered' THEN 1 ELSE 0 END)`,
    cancelled: sql<number>`SUM(CASE WHEN ${orders.orderStatus} = 'cancelled' THEN 1 ELSE 0 END)`,
  }).from(orders);

  const [agentCount] = await db.select({
    totalAgents: sql<number>`COUNT(*)`,
  }).from(users).where(eq(users.role, 'agent'));

  return {
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    totalAgents: Number(agentCount?.totalAgents ?? 0),
    inTransit: Number(orderStats?.inTransit ?? 0),
    totalCashback: Number(orderStats?.totalCashback ?? 0),
    totalRevenue: Number(orderStats?.totalRevenue ?? 0),
    paidOrders: Number(orderStats?.paidOrders ?? 0),
    byStatus: {
      processing: Number(orderStats?.processing ?? 0),
      shipped: Number(orderStats?.shipped ?? 0),
      delivered: Number(orderStats?.delivered ?? 0),
      cancelled: Number(orderStats?.cancelled ?? 0),
    },
  };
}

export async function getRecentOrders(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      orderStatus: orders.orderStatus,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      agentId: orders.agentId,
      agentName: users.name,
    })
    .from(orders)
    .leftJoin(users, eq(orders.agentId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return result;
}

export async function getAgentOrderStats() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      agentId: orders.agentId,
      name: users.name,
      orders: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.agentId, users.id))
    .groupBy(orders.agentId, users.name)
    .orderBy(desc(sql`COUNT(*)`));
  return result.map(r => ({ name: r.name ?? 'Unknown', orders: Number(r.orders) }));
}

export async function getAgentStats(agentId: number) {
  const db = await getDb();
  if (!db) return { totalOrders: 0, paidOrders: 0, totalRevenue: 0, totalCashback: 0 };

  const [stats] = await db.select({
    totalOrders: sql<number>`COUNT(*)`,
    paidOrders: sql<number>`SUM(CASE WHEN ${orders.paymentStatus} = 'paid' THEN 1 ELSE 0 END)`,
    totalRevenue: sql<number>`SUM(CAST(${orders.orderValue} AS DECIMAL(10,2)))`,
    totalCashback: sql<number>`SUM(CAST(${orders.cashback} AS DECIMAL(10,2)))`,
  }).from(orders).where(eq(orders.agentId, agentId));

  return {
    totalOrders: Number(stats?.totalOrders ?? 0),
    paidOrders: Number(stats?.paidOrders ?? 0),
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    totalCashback: Number(stats?.totalCashback ?? 0),
  };
}
