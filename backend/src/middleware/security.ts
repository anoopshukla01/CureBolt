import { Request, Response, NextFunction } from 'express';

// ============================================================================
// 1. SECURITY HEADERS MIDDLEWARE
// ============================================================================
export function secureHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Clickjacking defense
  res.setHeader('X-Frame-Options', 'DENY');
  // Legacy XSS filter activation
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions Policy - block microphone, camera, geolocation on API responses
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');

  // HSTS in production or non-local
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Basic API Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none';");

  next();
}

// ============================================================================
// 2. CONFIGURABLE STRICT CORS
// ============================================================================
export const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://medcure.in',
  'https://www.medcure.in',
  'https://admin.medcure.in',
  'https://pharmacy.medcure.in'
];

export function corsOriginVerifier(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  // Allow mobile apps, curl, server-to-server or test requests without origin
  if (!origin) {
    return callback(null, true);
  }

  const validOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultAllowedOrigins;
  if (validOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS policy violation: origin '${origin}' is not authorized.`));
}

// ============================================================================
// 3. SLIDING-WINDOW IN-MEMORY RATE LIMITER
// ============================================================================
interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private name: string;

  constructor(maxRequests: number, windowMs: number, name: string = 'api') {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.name = name;
  }

  public getMiddleware(keyExtractor?: (req: Request) => string) {
    return (req: Request, res: Response, next: NextFunction) => {
      // In test mode, allow header-based bypass if explicitly requested for specific test assertions
      if (process.env.NODE_ENV === 'test' && req.headers['x-bypass-rate-limit'] === 'true') {
        return next();
      }

      const identifier = req.body?.phone || req.body?.email || req.body?.userId || '';
      const clientKey = keyExtractor
        ? keyExtractor(req)
        : `${req.ip || req.socket.remoteAddress || 'unknown-client'}${identifier ? `:${identifier}` : ''}`;

      const now = Date.now();
      const windowStart = now - this.windowMs;

      let record = this.records.get(clientKey);
      if (!record) {
        record = { timestamps: [] };
        this.records.set(clientKey, record);
      }

      // Filter timestamps outside current rolling window
      record.timestamps = record.timestamps.filter(ts => ts > windowStart);

      const remaining = Math.max(0, this.maxRequests - record.timestamps.length);
      const oldestTimestamp = record.timestamps[0] || now;
      const resetSeconds = Math.ceil((oldestTimestamp + this.windowMs - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.timestamps.length >= this.maxRequests) {
        res.setHeader('Retry-After', resetSeconds);
        const detailMsg = `Rate limit of ${this.maxRequests} requests per ${this.windowMs / 1000}s exceeded on ${this.name} endpoint.`;
        return res.status(429).json({
          type: 'https://medcure.in/errors/rate-limit-exceeded',
          title: 'Rate Limit Exceeded',
          status: 429,
          detail: detailMsg,
          error: detailMsg,
          retryAfterSeconds: resetSeconds
        });
      }

      record.timestamps.push(now);
      next();
    };
  }

  public reset() {
    this.records.clear();
  }
}

// Standard Limiters
export const authRateLimiter = new SlidingWindowRateLimiter(15, 15 * 60 * 1000, 'authentication'); // 15 req / 15m
export const searchRateLimiter = new SlidingWindowRateLimiter(60, 60 * 1000, 'search'); // 60 req / min
export const paymentRateLimiter = new SlidingWindowRateLimiter(20, 15 * 60 * 1000, 'payment'); // 20 req / 15m
export const aiRateLimiter = new SlidingWindowRateLimiter(20, 60 * 1000, 'ai_assistant'); // 20 req / min
export const generalApiLimiter = new SlidingWindowRateLimiter(300, 60 * 1000, 'general_api'); // 300 req / min
