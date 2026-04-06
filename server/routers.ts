import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  upsertUser,
  getUserByOpenId,
  getUserById,
  getAllAgents,
  getAllUsers,
  updateUserProfile,
  createOrder,
  updateOrder,
  getOrderById,
  getOrdersByAgent,
  getAllOrders,
  deleteOrder,
  getOrderByTrackingOrOrderNo,
  addOrderTrace,
  getOrderTraces,
  deleteOrderTraces,
  getAdminStats,
  getAgentStats,
  getRecentOrders,
  getAgentOrderStats,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { sendOrderNotification } from "./notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const agentOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'agent') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Agent or admin access required' });
  }
  return next({ ctx });
});

// ─── Order input schemas ──────────────────────────────────────────────────────

const orderCreateInput = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerAddress: z.string().min(1),
  productName: z.string().min(1),
  productSize: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  productPrice: z.number().min(0).default(0),
  orderValue: z.number().min(0).default(0),
  productImageUrl: z.string().optional(),
  aadhaarFrontUrl: z.string().optional(),
  aadhaarBackUrl: z.string().optional(),
  paymentStatus: z.enum(["unpaid", "paid"]).default("unpaid"),
  cashback: z.number().min(0).default(0),
  orderStatus: z.enum(["processing", "shipped", "delivered", "cancelled"]).default("processing"),
  trackingNumber: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  notes: z.string().optional(),
  traces: z.array(z.object({
    description: z.string(),
    location: z.string().optional(),
    tracedAt: z.string().optional(),
  })).optional(),
});

const orderUpdateInput = orderCreateInput.partial().extend({
  id: z.number().int(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    myOrders: agentOrAdminProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') return getAllOrders();
      return getOrdersByAgent(ctx.user.id);
    }),

    getById: agentOrAdminProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role !== 'admin' && order.agentId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const traces = await getOrderTraces(input.id);
        return { ...order, traces };
      }),

    create: agentOrAdminProcedure
      .input(orderCreateInput)
      .mutation(async ({ ctx, input }) => {
        const { traces, ...orderData } = input;
        const order = await createOrder({
          ...orderData,
          agentId: ctx.user.id,
          productPrice: String(orderData.productPrice),
          orderValue: String(orderData.orderValue),
          cashback: String(orderData.cashback),
        });
        if (!order) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        // Add traces if provided
        if (traces && traces.length > 0) {
          for (const trace of traces) {
            await addOrderTrace({
              orderId: order.id,
              description: trace.description,
              location: trace.location,
            });
          }
        }
        return order;
      }),

    update: agentOrAdminProcedure
      .input(orderUpdateInput)
      .mutation(async ({ ctx, input }) => {
        const { id, traces, ...data } = input;
        const existing = await getOrderById(id);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role !== 'admin' && existing.agentId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Agents cannot change price/cashback
        const updateData: Record<string, unknown> = { ...data };
        if (ctx.user.role !== 'admin') {
          delete updateData.productPrice;
          delete updateData.cashback;
          delete updateData.orderStatus;
          delete updateData.trackingNumber;
          delete updateData.origin;
          delete updateData.destination;
        }

        if (updateData.productPrice !== undefined) updateData.productPrice = String(updateData.productPrice);
        if (updateData.orderValue !== undefined) updateData.orderValue = String(updateData.orderValue);
        if (updateData.cashback !== undefined) updateData.cashback = String(updateData.cashback);

        const updated = await updateOrder(id, updateData as any);

        // Handle traces update
        if (traces !== undefined) {
          await deleteOrderTraces(id);
          for (const trace of traces) {
            if (trace.description) {
              await addOrderTrace({
                orderId: id,
                description: trace.description,
                location: trace.location,
              });
            }
          }
        }

        return updated;
      }),

    delete: agentOrAdminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getOrderById(input.id);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role !== 'admin' && existing.agentId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await deleteOrder(input.id);
        return { success: true };
      }),

    myStats: agentOrAdminProcedure.query(async ({ ctx }) => {
      return getAgentStats(ctx.user.id);
    }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),

    allOrders: adminProcedure.query(async () => {
      const allOrders = await getAllOrders();
      return allOrders;
    }),

    allAgents: adminProcedure.query(async () => {
      const agents = await getAllAgents();
      // Attach order stats per agent
      const agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          const stats = await getAgentStats(agent.id);
          return { ...agent, ...stats };
        })
      );
      return agentsWithStats;
    }),

    updateOrderStatus: adminProcedure
      .input(z.object({
        id: z.number().int(),
        orderStatus: z.enum(["processing", "shipped", "delivered", "cancelled"]).optional(),
        paymentStatus: z.enum(["unpaid", "paid"]).optional(),
        cashback: z.number().min(0).optional(),
        trackingNumber: z.string().optional(),
        origin: z.string().optional(),
        destination: z.string().optional(),
        productPrice: z.number().min(0).optional(),
        orderValue: z.number().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const existing = await getOrderById(id);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

        const updateData: Record<string, unknown> = {};
        if (data.orderStatus !== undefined) updateData.orderStatus = data.orderStatus;
        if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
        if (data.cashback !== undefined) updateData.cashback = String(data.cashback);
        if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
        if (data.origin !== undefined) updateData.origin = data.origin;
        if (data.destination !== undefined) updateData.destination = data.destination;
        if (data.productPrice !== undefined) updateData.productPrice = String(data.productPrice);
        if (data.orderValue !== undefined) updateData.orderValue = String(data.orderValue);

        const updated = await updateOrder(id, updateData as any);

        // Send email notification to agent
        const agent = await getUserById(existing.agentId);
        if (agent?.email) {
          const changes: string[] = [];
          if (data.orderStatus && data.orderStatus !== existing.orderStatus) {
            changes.push(`Order status updated to **${data.orderStatus}**`);
          }
          if (data.cashback !== undefined && String(data.cashback) !== String(existing.cashback)) {
            changes.push(`Cashback assigned: ₹${data.cashback}`);
          }
          if (data.trackingNumber && data.trackingNumber !== existing.trackingNumber) {
            changes.push(`Tracking number added: ${data.trackingNumber}`);
          }
          if (changes.length > 0) {
            await sendOrderNotification(agent.email, agent.name ?? 'Agent', existing.orderNo, changes);
          }
        }

        return updated;
      }),

    addTrace: adminProcedure
      .input(z.object({
        orderId: z.number().int(),
        description: z.string().min(1),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await addOrderTrace(input);
        return { success: true };
      }),

    deleteTrace: adminProcedure
      .input(z.object({ orderId: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteOrderTraces(input.orderId);
        return { success: true };
      }),

    getOrderWithTraces: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
        const traces = await getOrderTraces(input.id);
        const agent = await getUserById(order.agentId);
        return { ...order, traces, agent };
      }),

    recentOrders: adminProcedure.query(async () => {
      return getRecentOrders(10);
    }),

    agentStats: adminProcedure.query(async () => {
      return getAgentOrderStats();
    }),
  }),

  // ── Upload ────────────────────────────────────────────────────────────────
  upload: router({
    getUploadUrl: protectedProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        folder: z.enum(["aadhaar", "product"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Return a signed upload token (we'll do server-side upload via base64)
        const key = `${input.folder}/${ctx.user.id}-${nanoid(8)}-${input.filename}`;
        return { key, uploadReady: true };
      }),

    uploadFile: protectedProcedure
      .input(z.object({
        key: z.string(),
        base64Data: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const base64 = input.base64Data.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const { url } = await storagePut(input.key, buffer, input.contentType);
        return { url };
      }),
  }),

  // ── Public Tracking ───────────────────────────────────────────────────────
  tracking: router({
    lookup: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const order = await getOrderByTrackingOrOrderNo(input.query.trim());
        if (!order) return null;
        const traces = await getOrderTraces(order.id);
        return {
          orderNo: order.orderNo,
          trackingNumber: order.trackingNumber,
          origin: order.origin,
          destination: order.destination,
          orderStatus: order.orderStatus,
          traces: traces.map(t => ({
            description: t.description,
            location: t.location,
            time: t.tracedAt,
          })),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
