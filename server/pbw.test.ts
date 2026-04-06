import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Test context helpers ─────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-open-id",
    email: "test@pbw.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeClearedCookies() {
  const cleared: Array<{ name: string; options: Record<string, unknown> }> = [];
  return {
    cleared,
    clearCookie: (name: string, options: Record<string, unknown>) => {
      cleared.push({ name, options });
    },
  };
}

function makeCtx(user: AuthenticatedUser | null = null, clearCookie?: Function): TrpcContext {
  const { clearCookie: defaultClear } = makeClearedCookies();
  return {
    user: user as TrpcContext["user"],
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: clearCookie ?? defaultClear } as TrpcContext["res"],
  };
}

// ─── auth.logout ──────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { cleared, clearCookie } = makeClearedCookies();
    const ctx = makeCtx(makeUser(), clearCookie);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(cleared).toHaveLength(1);
    expect(cleared[0]?.name).toBe(COOKIE_NAME);
    expect(cleared[0]?.options).toMatchObject({
      maxAge: -1,
      httpOnly: true,
      path: "/",
    });
  });

  it("allows unauthenticated users to log out (publicProcedure)", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── auth.me ─────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns the current user when authenticated", async () => {
    const user = makeUser({ name: "PBW Agent", role: "agent" as any });
    const ctx = makeCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.name).toBe("PBW Agent");
    expect(result?.role).toBe("agent");
  });
});

// ─── admin procedures (RBAC) ─────────────────────────────────────────────────

describe("admin procedures - RBAC enforcement", () => {
  it("throws FORBIDDEN when a non-admin calls admin.stats", async () => {
    const ctx = makeCtx(makeUser({ role: "user" }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN when an agent calls admin.allOrders", async () => {
    const ctx = makeCtx(makeUser({ role: "agent" as any }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN when an agent calls admin.allAgents", async () => {
    const ctx = makeCtx(makeUser({ role: "agent" as any }));
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.allAgents()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── orders procedures (RBAC) ─────────────────────────────────────────────────

describe("orders procedures - RBAC enforcement", () => {
  it("throws UNAUTHORIZED when unauthenticated user calls orders.myOrders", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.myOrders()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws UNAUTHORIZED when unauthenticated user calls orders.myStats", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.orders.myStats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

// ─── tracking (public) ───────────────────────────────────────────────────────

describe("tracking.lookup - public access", () => {
  it("returns null for a non-existent tracking query (no DB required)", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    // Without a database, the helper returns undefined which maps to null
    const result = await caller.tracking.lookup({ query: "NON-EXISTENT-ORDER" });
    expect(result).toBeNull();
  });
});

// ─── auth.updateProfile ───────────────────────────────────────────────────────

describe("auth.updateProfile", () => {
  it("throws UNAUTHORIZED when called without authentication", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.updateProfile({ name: "New Name" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
