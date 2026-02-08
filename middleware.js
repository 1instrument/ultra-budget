// Vercel Edge Middleware for Rate Limiting
// This limits requests to /api/* routes to prevent abuse

const rateLimit = new Map();
const WINDOW_MS = 60000; // 1 minute window
const MAX_REQUESTS = 30; // 30 requests per minute per IP

export function middleware(request) {
    // Only apply to API routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return;
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, start: now });
    } else {
        const record = rateLimit.get(ip);

        // Reset window if expired
        if (now - record.start > WINDOW_MS) {
            record.count = 1;
            record.start = now;
        } else {
            record.count++;
        }

        // Block if over limit
        if (record.count > MAX_REQUESTS) {
            return new Response(
                JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': '60'
                    }
                }
            );
        }
    }

    // Clean up old entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
        const cutoff = now - WINDOW_MS;
        for (const [key, value] of rateLimit.entries()) {
            if (value.start < cutoff) {
                rateLimit.delete(key);
            }
        }
    }
}

export const config = {
    matcher: '/api/:path*'
};
