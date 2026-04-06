// Security Utilities for Input Validation and Rate Limiting

// Input Validation
export const validators = {
  // Validate email format
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate password strength
  password: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // Validate name (no special characters except spaces, hyphens, apostrophes)
  name: (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s\-']{2,100}$/;
    return nameRegex.test(name.trim());
  },

  // Validate phone number (basic format)
  phone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  },

  // Validate URL
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validate positive number
  positiveNumber: (num: any): boolean => {
    const n = Number(num);
    return !isNaN(n) && n >= 0;
  },

  // Sanitize string (remove potentially harmful characters)
  sanitizeString: (str: string): string => {
    return str
      .replace(/[<>\"']/g, "") // Remove HTML/script characters
      .trim()
      .substring(0, 500); // Limit length
  },

  // Validate tracking number format
  trackingNumber: (trackingNumber: string): boolean => {
    const trackingRegex = /^[A-Z0-9\-]{5,50}$/;
    return trackingRegex.test(trackingNumber.toUpperCase());
  },

  // Validate order ID
  orderId: (orderId: string): boolean => {
    const orderRegex = /^[A-Z0-9\-]{3,50}$/;
    return orderRegex.test(orderId.toUpperCase());
  },
};

// Rate Limiting
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      // First attempt
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > record.resetTime) {
      // Window expired, reset
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    // Window still active
    record.count++;
    return record.count > this.maxAttempts;
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  resetAll(): void {
    this.attempts.clear();
  }
}

// Create rate limiters for different operations
export const rateLimiters = {
  login: new RateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  register: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  passwordReset: new RateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  api: new RateLimiter(100, 60 * 1000), // 100 requests per minute
};

// CSRF Token Management
class CSRFTokenManager {
  private tokens: Map<string, { token: string; createdAt: number }> = new Map();
  private readonly tokenExpiry: number = 60 * 60 * 1000; // 1 hour

  generateToken(sessionId: string): string {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now(),
    });

    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const record = this.tokens.get(sessionId);

    if (!record) {
      return false;
    }

    // Check expiry
    if (Date.now() - record.createdAt > this.tokenExpiry) {
      this.tokens.delete(sessionId);
      return false;
    }

    // Verify token
    return record.token === token;
  }

  invalidateToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, record] of this.tokens.entries()) {
      if (now - record.createdAt > this.tokenExpiry) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

export const csrfTokenManager = new CSRFTokenManager();

// Content Security Policy Headers (for reference)
export const cspHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

// Security Headers (for reference)
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// Input Sanitization
export function sanitizeInput(input: string, maxLength: number = 500): string {
  return input
    .replace(/[<>\"'`]/g, "") // Remove HTML/script characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim()
    .substring(0, maxLength);
}

// XSS Prevention - Escape HTML
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// SQL Injection Prevention - Parameterized queries (for backend reference)
export function isSQLInjectionAttempt(input: string): boolean {
  const sqlKeywords = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "CREATE",
    "ALTER",
    "EXEC",
    "EXECUTE",
    "UNION",
    "--",
    ";",
    "/*",
    "*/",
  ];

  const upperInput = input.toUpperCase();
  return sqlKeywords.some(keyword => upperInput.includes(keyword));
}

// Session Management
export class SessionManager {
  private sessionId: string;
  private createdAt: number;
  private lastActivityAt: number;
  private readonly sessionTimeout: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.sessionId = this.generateSessionId();
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    this.saveToStorage();
  }

  private generateSessionId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private saveToStorage(): void {
    localStorage.setItem("pbw_session", JSON.stringify({
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt,
    }));
  }

  recordActivity(): void {
    this.lastActivityAt = Date.now();
    this.saveToStorage();
  }

  isExpired(): boolean {
    return Date.now() - this.lastActivityAt > this.sessionTimeout;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  invalidate(): void {
    localStorage.removeItem("pbw_session");
  }
}

export const sessionManager = new SessionManager();
