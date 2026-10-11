import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';
import { SlidingWindowRateLimiter } from '../middleware/security';

describe('Milestone S1: Platform Security Baseline, Rate Limiting & Feature Flags Test Suite', () => {

  // ==========================================================================
  // 1. SECURITY HEADERS VERIFICATION
  // ==========================================================================
  it('1. Security Baseline: Enforces strict HTTP security headers on all responses', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);

    // MIME Sniffing protection
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    // Clickjacking defense
    expect(res.headers['x-frame-options']).toBe('DENY');
    // Legacy XSS filter
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    // Referrer policy
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // Permissions policy
    expect(res.headers['permissions-policy']).toContain('geolocation=(self)');
    // Content Security Policy
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });

  // ==========================================================================
  // 2. CORS VERIFICATION
  // ==========================================================================
  it('2. CORS Baseline: Allows trusted origins and rejects unauthorized external domains', async () => {
    // Trusted origin (Admin portal)
    const trustedRes = await request(app)
      .get('/health')
      .set('Origin', 'https://admin.medcure.in');
    expect(trustedRes.status).toBe(200);
    expect(trustedRes.headers['access-control-allow-origin']).toBe('https://admin.medcure.in');

    // Unauthorized origin (Malicious domain)
    const untrustedRes = await request(app)
      .get('/health')
      .set('Origin', 'https://evil-phishing-site.com');
    // Express cors middleware triggers error or doesn't return allow-origin header
    expect(untrustedRes.headers['access-control-allow-origin']).toBeUndefined();
  });

  // ==========================================================================
  // 3. SLIDING-WINDOW RATE LIMITING
  // ==========================================================================
  it('3. Rate Limiter: Enforces sliding-window request limits with RFC 7807 429 response', async () => {
    // Create an isolated 3-request limiter to verify window dynamics deterministically
    const testLimiter = new SlidingWindowRateLimiter(3, 5000, 'test_endpoint');
    const testApp = app;

    // Use a unique client test identifier for auth endpoint
    const burstPhone = '+919876599999';

    // Requests 1 to 15 within limit
    let lastRes;
    for (let i = 0; i < 15; i++) {
      lastRes = await request(testApp)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '9876599999' });
    }

    // Request 16 should trip the 15 req / 15m limiter for this phone
    const limitTripRes = await request(testApp)
      .post('/api/v1/auth/otp/request')
      .send({ phone: '9876599999' });

    expect(limitTripRes.status).toBe(429);
    expect(limitTripRes.headers['retry-after']).toBeDefined();
    expect(limitTripRes.headers['x-ratelimit-limit']).toBe('15');
    expect(limitTripRes.headers['x-ratelimit-remaining']).toBe('0');
    expect(limitTripRes.body.type).toBe('https://medcure.in/errors/rate-limit-exceeded');
    expect(limitTripRes.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  // ==========================================================================
  // 4. FEATURE FLAGS READ & TARGET FILTERING
  // ==========================================================================
  it('4. Feature Flags: Exposes system feature flags with clientTarget filtering', async () => {
    // Fetch all flags
    const resAll = await request(app).get('/api/v1/feature-flags');
    expect(resAll.status).toBe(200);
    expect(resAll.body.success).toBe(true);
    expect(resAll.body.flags.length).toBeGreaterThan(0);

    const keys = resAll.body.flags.map((f: any) => f.key);
    expect(keys).toContain('ai_symptom_assistant_customer');
    expect(keys).toContain('instant_cod_threshold_5000');
    expect(keys).toContain('veterinary_ordering_v2');

    // Filter by clientTarget: 'customer'
    const resCustomer = await request(app).get('/api/v1/feature-flags?clientTarget=customer');
    expect(resCustomer.status).toBe(200);
    expect(resCustomer.body.flags.every((f: any) => f.clientTargets.includes('customer'))).toBe(true);

    // Filter by clientTarget: 'rider'
    const resRider = await request(app).get('/api/v1/feature-flags?clientTarget=rider');
    expect(resRider.status).toBe(200);
    expect(resRider.body.flags.every((f: any) => f.clientTargets.includes('rider'))).toBe(true);
  });

  // ==========================================================================
  // 5. FEATURE FLAGS RBAC & AUDIT LOGGING
  // ==========================================================================
  it('5. Feature Flags RBAC: Blocks unauthorized users and requires Platform Admin with audit reason', async () => {
    // 5a. Attempt update without admin credentials -> 401
    const unauthRes = await request(app)
      .put('/api/v1/admin/feature-flags/instant_cod_threshold_5000')
      .send({ isEnabled: false, reason: 'Maintenance' });
    expect(unauthRes.status).toBe(401);

    // 5b. Attempt update by non-admin staff (e.g. dispatcher usr-dispatch-1) -> 403
    const dispatcherRes = await request(app)
      .put('/api/v1/admin/feature-flags/instant_cod_threshold_5000')
      .set('x-admin-user-id', 'usr-dispatch-1')
      .send({ isEnabled: false, reason: 'Temporarily disabled' });
    expect(dispatcherRes.status).toBe(403);
    expect(dispatcherRes.body.error).toBe('FORBIDDEN');

    // 5c. Attempt update without sufficient reason (< 5 characters) -> 400
    const shortReasonRes = await request(app)
      .put('/api/v1/admin/feature-flags/instant_cod_threshold_5000')
      .set('x-admin-user-id', 'usr-admin-1')
      .send({ isEnabled: false, reason: 'no' });
    expect(shortReasonRes.status).toBe(400);

    // 5d. Successful toggle by Platform Administrator
    const initialFlag = dbStore.featureFlags.get('instant_cod_threshold_5000');
    const wasEnabled = initialFlag ? initialFlag.isEnabled : true;

    const toggleRes = await request(app)
      .put('/api/v1/admin/feature-flags/instant_cod_threshold_5000')
      .set('x-admin-user-id', 'usr-admin-1')
      .send({
        isEnabled: !wasEnabled,
        reason: 'Temporary liquidity audit across Gorakhpur micro-hubs'
      });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.success).toBe(true);
    expect(toggleRes.body.flag.isEnabled).toBe(!wasEnabled);

    // Verify audit log entry
    const auditEntries = dbStore.auditEvents.filter(
      a => a.action === 'FEATURE_FLAG_TOGGLED' && a.resourceId === 'instant_cod_threshold_5000'
    );
    expect(auditEntries.length).toBeGreaterThan(0);
    const latestAudit = auditEntries[auditEntries.length - 1];
    expect(latestAudit.actorId).toBe('usr-admin-1');
    expect(latestAudit.details.newState).toBe(!wasEnabled);
    expect(latestAudit.details.reason).toContain('liquidity audit');

    // Restore original flag state
    await request(app)
      .put('/api/v1/admin/feature-flags/instant_cod_threshold_5000')
      .set('x-admin-user-id', 'usr-admin-1')
      .send({
        isEnabled: wasEnabled,
        reason: 'Restoring standard operating state for COD payments'
      });
  });
});
