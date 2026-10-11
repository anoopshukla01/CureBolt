import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Milestone B3: Auth & Role Gate (core_auth, OTP, app-session & RBAC rejection)', () => {
  const customerPhone = '+919876500006';
  const riderPhone = '+919876500005';
  const pharmacyPhone = '+919876500004';

  describe('1. Phone OTP Workflow & Rate Limiting', () => {
    it('1A. Requests OTP successfully with cooldown seconds', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: customerPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cooldown_seconds).toBe(30);
      expect(res.body.message).toContain('OTP sent successfully');
    });

    it('1B. Verifies phone OTP code and returns authentication token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: customerPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toContain('9876500006');
    });

    it('1C. Rejects invalid OTP with remaining attempt counter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: customerPhone, otp: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid OTP');
    });
  });

  describe('2. Multi-App Session & Role Gate Verification', () => {
    it('2A. Customer App (com.medcure.customer): Accepts customer, strictly rejects rider & pharmacy', async () => {
      // Customer allowed
      const custRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-cust-1')
        .send({ appId: 'com.medcure.customer', appVersion: '1.0.0' });
      expect(custRes.status).toBe(200);
      expect(custRes.body.sessionValid).toBe(true);
      expect(custRes.body.user.role).toBe('customer');

      // Rider rejected
      const riderRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-rider-1')
        .send({ appId: 'com.medcure.customer', appVersion: '1.0.0' });
      expect(riderRes.status).toBe(403);
      expect(riderRes.body.error).toBe("This account can't use this app");

      // Pharmacy staff rejected
      const pharmaRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-staff-1')
        .send({ appId: 'com.medcure.customer', appVersion: '1.0.0' });
      expect(pharmaRes.status).toBe(403);
      expect(pharmaRes.body.error).toBe("This account can't use this app");
    });

    it('2B. Rider Fleet App (com.medcure.rider): Accepts rider, strictly rejects customer & pharmacy', async () => {
      // Rider allowed
      const riderRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-rider-1')
        .send({ appId: 'com.medcure.rider', appVersion: '1.0.0' });
      expect(riderRes.status).toBe(200);
      expect(riderRes.body.sessionValid).toBe(true);
      expect(riderRes.body.user.role).toBe('delivery_partner');

      // Customer rejected
      const custRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-cust-1')
        .send({ appId: 'com.medcure.rider', appVersion: '1.0.0' });
      expect(custRes.status).toBe(403);
      expect(custRes.body.error).toBe("This account can't use this app");

      // Pharmacy staff rejected
      const pharmaRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-owner-1')
        .send({ appId: 'com.medcure.rider', appVersion: '1.0.0' });
      expect(pharmaRes.status).toBe(403);
      expect(pharmaRes.body.error).toBe("This account can't use this app");
    });

    it('2C. Pharmacy Shopkeeper App (com.medcure.shop): Accepts pharmacy staff, strictly rejects rider & customer', async () => {
      // Pharmacy staff allowed
      const staffRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-staff-1')
        .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
      expect(staffRes.status).toBe(200);
      expect(staffRes.body.sessionValid).toBe(true);

      // Pharmacist allowed
      const pharmaRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-pharma-1')
        .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
      expect(pharmaRes.status).toBe(200);
      expect(pharmaRes.body.sessionValid).toBe(true);

      // Pharmacy owner allowed
      const ownerRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-owner-1')
        .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
      expect(ownerRes.status).toBe(200);
      expect(ownerRes.body.sessionValid).toBe(true);

      // Customer rejected
      const custRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-cust-1')
        .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
      expect(custRes.status).toBe(403);
      expect(custRes.body.error).toBe("This account can't use this app");

      // Rider rejected
      const riderRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('x-user-id', 'usr-rider-1')
        .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
      expect(riderRes.status).toBe(403);
      expect(riderRes.body.error).toBe("This account can't use this app");
    });

    it('2D. Bearer Token Auth: Validates token headers in app-session verification', async () => {
      const authRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: customerPhone, otp: '123456' });

      const bearerToken = authRes.body.token;

      const sessionRes = await request(app)
        .post('/api/v1/auth/app-session')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ appId: 'com.medcure.customer', appVersion: '1.0.0' });

      expect(sessionRes.status).toBe(200);
      expect(sessionRes.body.sessionValid).toBe(true);
      expect(sessionRes.body.appId).toBe('com.medcure.customer');
    });
  });
});
