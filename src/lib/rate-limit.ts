/**
 * Rate Limiting System (Enhanced)
 * - Login: 12 attempts per 15 minutes
 * - API: 100 requests per minute
 * 
 * ⚠️ PRODUCTION WARNING: This in-memory store resets on server restart.
 * For production, use Redis or a database-backed solution like:
 * - Upstash Redis
 * - Vercel KV
 * - Database table with TTL
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  // Track first attempt for security logging
  firstAttemptAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  // Add security metadata
  isFirstAttempt?: boolean;
  attemptsInWindow?: number;
}

/**
 * Rate limit for login attempts
 * 12 attempts per 15 minutes per IP
 * 
 * ⚠️ PRODUCTION: Consider implementing:
 * - Account lockout after X failed attempts
 * - CAPTCHA after Y attempts
 * - Email notification to user on suspicious activity
 * - IP reputation checking
 */
export function rateLimitLogin(ip: string): RateLimitResult {
  const key = `login:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 12;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
      firstAttemptAt: now,
    };
    rateLimitStore.set(key, newEntry);
    
    return {
      success: true,
      limit: maxAttempts,
      remaining: maxAttempts - 1,
      reset: now + windowMs,
      isFirstAttempt: true,
      attemptsInWindow: 1,
    };
  }

  if (entry.count >= maxAttempts) {
    // Rate limit exceeded
    return {
      success: false,
      limit: maxAttempts,
      remaining: 0,
      reset: entry.resetAt,
      isFirstAttempt: false,
      attemptsInWindow: entry.count,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: maxAttempts,
    remaining: maxAttempts - entry.count,
    reset: entry.resetAt,
    isFirstAttempt: false,
    attemptsInWindow: entry.count,
  };
}

/**
 * Rate limit for API requests
 * 100 requests per minute per IP
 * 
 * ⚠️ PRODUCTION: Consider implementing:
 * - Different limits per endpoint
 * - User-based rate limiting (not just IP)
 * - Tiered limits based on user role
 * - Distributed rate limiting with Redis
 */
export function rateLimitAPI(ip: string): RateLimitResult {
  const key = `api:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
      firstAttemptAt: now,
    };
    rateLimitStore.set(key, newEntry);
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
      isFirstAttempt: true,
      attemptsInWindow: 1,
    };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: entry.resetAt,
      isFirstAttempt: false,
      attemptsInWindow: entry.count,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetAt,
    isFirstAttempt: false,
    attemptsInWindow: entry.count,
  };
}

/**
 * Get client IP address from request
 * Enhanced to handle various proxy configurations
 */
export function getClientIP(request: Request): string {
  // Priority order for IP detection:
  // 1. X-Forwarded-For (most common with proxies)
  // 2. X-Real-IP (Nginx)
  // 3. CF-Connecting-IP (Cloudflare)
  // 4. True-Client-IP (Akamai/Cloudflare)
  
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP in chain (client IP)
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  const trueClientIP = request.headers.get('true-client-ip');
  if (trueClientIP) {
    return trueClientIP.trim();
  }

  // Fallback to unknown if no IP found
  return 'unknown';
}

/**
 * Clear rate limit for a specific key (for testing or admin override)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(ip: string, type: 'login' | 'api'): RateLimitResult | null {
  const key = `${type}:${ip}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (entry.resetAt < now) {
    return null;
  }

  const maxAttempts = type === 'login' ? 12 : 100;
  
  return {
    success: entry.count < maxAttempts,
    limit: maxAttempts,
    remaining: Math.max(0, maxAttempts - entry.count),
    reset: entry.resetAt,
    attemptsInWindow: entry.count,
  };
}