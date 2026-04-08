import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import mysql from "mysql2/promise";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "./authRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getFileBuffer } from "../storage";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Run migrations using a raw mysql2 connection (bypasses Drizzle's error wrapping).
 * This lets us properly detect MySQL error codes like ER_DUP_FIELDNAME (1060).
 */
async function runMigrations(conn: mysql.Connection) {
  // 1. Ensure 'phone' column exists on users table
  try {
    await conn.execute("ALTER TABLE `users` ADD COLUMN `phone` varchar(32)");
    console.log("[DB] Added column users.phone");
  } catch (err: any) {
    if (err?.errno === 1060) {
      console.log("[DB] Column users.phone already exists");
    } else {
      console.warn("[DB] Could not add users.phone:", err?.message || err);
    }
  }

  // 2. Ensure 'passwordHash' column exists on users table
  try {
    await conn.execute("ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255)");
    console.log("[DB] Added column users.passwordHash");
  } catch (err: any) {
    if (err?.errno === 1060) {
      console.log("[DB] Column users.passwordHash already exists");
    } else {
      console.warn("[DB] Could not add users.passwordHash:", err?.message || err);
    }
  }

  // 3. Ensure role enum includes 'agent'
  try {
    await conn.execute("ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','agent') NOT NULL DEFAULT 'agent'");
    console.log("[DB] Modified column users.role to include 'agent'");
  } catch (err: any) {
    console.warn("[DB] Could not modify users.role:", err?.message || err);
  }

  // 4. Ensure orders table exists
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`orderNo\` varchar(64) NOT NULL,
        \`agentId\` int NOT NULL,
        \`customerName\` varchar(255) NOT NULL,
        \`customerPhone\` varchar(32) NOT NULL,
        \`customerAddress\` text NOT NULL,
        \`productName\` varchar(255) NOT NULL,
        \`productSize\` varchar(64),
        \`quantity\` int NOT NULL DEFAULT 1,
        \`productPrice\` decimal(10,2) DEFAULT '0',
        \`orderValue\` decimal(10,2) DEFAULT '0',
        \`productImageUrl\` text,
        \`aadhaarFrontUrl\` text,
        \`aadhaarBackUrl\` text,
        \`paymentStatus\` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
        \`cashback\` decimal(10,2) DEFAULT '0',
        \`orderStatus\` enum('processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'processing',
        \`trackingNumber\` varchar(128),
        \`origin\` varchar(128),
        \`destination\` varchar(128),
        \`notes\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`orders_orderNo_unique\` (\`orderNo\`)
      )
    `);
    console.log("[DB] Orders table ready");
  } catch (err: any) {
    console.warn("[DB] Could not create orders table:", err?.message || err);
  }

  // 5. Ensure order_traces table exists
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`order_traces\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`orderId\` int NOT NULL,
        \`description\` varchar(512) NOT NULL,
        \`location\` varchar(255),
        \`tracedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      )
    `);
    console.log("[DB] Order traces table ready");
  } catch (err: any) {
    console.warn("[DB] Could not create order_traces table:", err?.message || err);
  }

  // 6. Verify the users table structure
  try {
    const [rows] = await conn.execute("DESCRIBE `users`");
    const columns = (rows as any[]).map((r: any) => r.Field);
    console.log("[DB] Users table columns:", columns.join(", "));
    if (!columns.includes("passwordHash")) {
      console.error("[DB] CRITICAL: passwordHash column is MISSING from users table!");
    }
    if (!columns.includes("phone")) {
      console.error("[DB] CRITICAL: phone column is MISSING from users table!");
    }
  } catch (err: any) {
    console.warn("[DB] Could not describe users table:", err?.message || err);
  }

  console.log("[DB] All migrations completed");
}

async function seedAdminUser() {
  const crypto = await import("crypto");
  const adminEmail = "probadmintonworld@proton.me";
  const adminPassword = "PBW@Admin@1";
  const { getUserByEmail, upsertUser, updateUserPasswordHash } = await import("../db");

  try {
    let adminUser = await getUserByEmail(adminEmail);
    if (!adminUser) {
      const openId = `local_admin_${crypto.randomBytes(8).toString("hex")}`;
      await upsertUser({
        openId,
        name: "PBW Admin",
        email: adminEmail,
        loginMethod: "email",
        role: "admin",
        lastSignedIn: new Date(),
      });
      adminUser = await getUserByEmail(adminEmail);
    }

    if (adminUser && !adminUser.passwordHash) {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.createHash("sha256").update(salt + adminPassword).digest("hex");
      await updateUserPasswordHash(adminUser.id, `${salt}:${hash}`);
      console.log("[DB] Admin user password set");
    }

    // Also ensure admin role is set
    if (adminUser && adminUser.role !== "admin") {
      await upsertUser({ openId: adminUser.openId, role: "admin" });
      console.log("[DB] Admin role updated");
    }

    console.log("[DB] Admin user ready:", adminEmail);
  } catch (error: any) {
    console.error("[DB] Admin seeding error:", error?.message);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Run database migrations using raw mysql2 connection (not Drizzle)
  if (process.env.DATABASE_URL) {
    let conn: mysql.Connection | null = null;
    try {
      conn = await mysql.createConnection(process.env.DATABASE_URL);
      console.log("[DB] Raw MySQL connection established for migrations");
      await runMigrations(conn);
    } catch (error: any) {
      console.error("[DB] Migration connection error:", error?.message);
    } finally {
      if (conn) {
        try { await conn.end(); } catch {}
      }
    }

    // Seed admin user using Drizzle (after migrations ensure schema is correct)
    try {
      const db = await getDb();
      if (db) {
        await seedAdminUser();
      }
    } catch (error: any) {
      console.error("[DB] Admin seeding error:", error?.message);
    }
  } else {
    console.warn("[DB] DATABASE_URL not set — skipping migrations");
  }

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Enable CORS for file uploads
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Custom email/password auth routes
  registerAuthRoutes(app);
  
  // File serving endpoint for uploaded files
  app.get("/api/files/*", async (req, res) => {
    try {
      const filePath = req.params[0];
      const buffer = await getFileBuffer(filePath);
      
      // Set appropriate content type based on file extension
      const ext = filePath.split(".").pop()?.toLowerCase();
      const contentTypeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        pdf: "application/pdf",
        txt: "text/plain",
      };
      
      const contentType = ext ? (contentTypeMap[ext] || "application/octet-stream") : "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(buffer);
    } catch (error) {
      console.error("File serving error:", error);
      res.status(404).send("File not found");
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }


  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}/`);
    console.log(`📁 File uploads available at http://localhost:${port}/api/files/`);
  });
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
