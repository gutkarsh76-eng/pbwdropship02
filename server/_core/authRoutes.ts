import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Simple password hashing using SHA-256 with salt
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.createHash("sha256").update(salt + password).digest("hex");
  return computed === hash;
}

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Find user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Verify password
      if (!user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      if (!verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Create session token using the same SDK as OAuth
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Return user info (without passwordHash)
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : '');
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        res.status(400).json({ error: "Email, name, and password are required" });
        return;
      }

      // Check if user already exists
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      // Hash password
      const passwordHash = hashPassword(password);

      // Generate a unique openId for this user (since they're not using OAuth)
      const openId = `local_${crypto.randomBytes(16).toString("hex")}`;

      // Create user in database
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "email",
        role: "agent",
        lastSignedIn: new Date(),
      });

      // Now set the password hash directly (upsertUser doesn't handle passwordHash)
      const newUser = await db.getUserByEmail(email);
      if (!newUser) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Update password hash in database
      await db.updateUserPasswordHash(newUser.id, passwordHash);

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      console.error("[Auth] Registration failed:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : '');
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Get current user info (from session cookie)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      res.status(401).json({ user: null });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
