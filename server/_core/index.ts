import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
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
 * Safely add a column to a table if it doesn't already exist.
 * Works with all MySQL versions (no IF NOT EXISTS needed).
 */
async function safeAddColumn(db: any, table: string, column: string, definition: string): Promise<boolean> {
  try {
    await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[DB] Added column ${table}.${column}`);
    return true;
  } catch (error: any) {
    if (error?.message?.includes("Duplicate column")) {
      console.log(`[DB] Column ${table}.${column} already exists`);
      return false;
    }
    throw error;
  }
}

/**
 * Safely modify a column's type/definition.
 */
async function safeModifyColumn(db: any, table: string, column: string, definition: string): Promise<void> {
  try {
    await db.execute(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`);
    console.log(`[DB] Modified column ${table}.${column}`);
  } catch (error: any) {
    console.warn(`[DB] Could not modify column ${table}.${column}:`, error?.message);
  }
}

async function runMigrations(db: any) {
  // 1. Ensure 'phone' column exists on users table
  await safeAddColumn(db, "users", "phone", "varchar(32)");

  // 2. Ensure 'passwordHash' column exists on users table
  await safeAddColumn(db, "users", "passwordHash", "varchar(255)");

  // 3. Ensure role enum includes 'agent' — modify the column to the full enum
  await safeModifyColumn(db, "users", "role", "enum('user','admin','agent') NOT NULL DEFAULT 'agent'");

  // 4. Ensure orders table exists
  try {
    await db.execute(`SELECT 1 FROM \`orders\` LIMIT 1`);
    console.log("[DB] Orders table exists");
  } catch {
    console.log("[DB] Creating orders table...");
    await db.execute(`
      CREATE TABLE \`orders\` (
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
    console.log("[DB] Orders table created");
  }

  // 5. Ensure order_traces table exists
  try {
    await db.execute(`SELECT 1 FROM \`order_traces\` LIMIT 1`);
    console.log("[DB] Order traces table exists");
  } catch {
    console.log("[DB] Creating order_traces table...");
    await db.execute(`
      CREATE TABLE \`order_traces\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`orderId\` int NOT NULL,
        \`description\` varchar(512) NOT NULL,
        \`location\` varchar(255),
        \`tracedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      )
    `);
    console.log("[DB] Order traces table created");
  }

  console.log("[DB] All migrations completed successfully");
}

async function seedAdminUser(db: any) {
  const crypto = await import("crypto");
  const adminEmail = "probadmintonworld@proton.me";
  const adminPassword = "PBW@Admin@1";
  const { getUserByEmail, upsertUser, updateUserPasswordHash } = await import("../db");

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
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Run database migrations
  try {
    const db = await getDb();
    if (db) {
      await runMigrations(db);
      await seedAdminUser(db);
    } else {
      console.warn("[DB] Database not available — skipping migrations");
    }
  } catch (error: any) {
    console.error("[DB] Migration error:", error?.message);
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
