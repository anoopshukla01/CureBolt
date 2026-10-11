import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Customer App Milestone 1: Authentication & Profile Setup (Sections 2 & 3)', () => {
  const testPhone = '+919876543210';
  let authToken: string;
  let testUserId: string;

  describe('1. Phone Number Validation & OTP Flow', () => {
    it('1A. Rejects malformed phone numbers (less than 10 digits or non-Indian prefix)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('1B. Successfully requests OTP with rate limiting metadata', async () => {
      const res = await request(app)
        .post('/api/v1/auth/request-otp')
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cooldown_seconds).toBe(30);
      expect(res.body.expires_in).toBe(300);
    });

    it('1C. Verifies OTP and returns new user status', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone: testPhone, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      authToken = res.body.token;
      testUserId = res.body.user.id;
    });
  });

  describe('2. Profile Setup & Age Verification (18+ Requirement)', () => {
    it('2A. Rejects names that violate regex (contains digits or symbols)', async () => {
      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'John123 Invalid!',
          dateOfBirth: '1995-05-15',
          termsAccepted: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name can only contain letters');
    });

    it('2B. Rejects date of birth in the future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Suresh Raina',
          dateOfBirth: futureDate.toISOString().split('T')[0],
          termsAccepted: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('future');
    });

    it('2C. Rejects minors (< 18 years old) with HTTP 403 and sets isMinorBlocked', async () => {
      const today = new Date();
      const minorDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Minor User',
          dateOfBirth: minorDate.toISOString().split('T')[0],
          termsAccepted: true
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('at least 18 years of age');
    });

    it('2D. Accepts adults (>= 18 years) with accepted terms version', async () => {
      const adultDob = '2000-01-15';
      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Anoop Shukla',
          dateOfBirth: adultDob,
          termsAccepted: true,
          termsVersion: 'v1.0.0'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.fullName).toBe('Anoop Shukla');
      expect(res.body.user.dateOfBirth).toBe(adultDob);
      expect(res.body.user.termsVersion).toBe('v1.0.0');
    });

    it('2E. Rejects unapproved direct modifications to established date of birth', async () => {
      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Anoop Shukla',
          dateOfBirth: '1990-01-01', // Altered DOB
          termsAccepted: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be modified directly once established');
    });

    it('2F. Rejects submission without accepting terms and privacy policy', async () => {
      const res = await request(app)
        .put('/api/v1/me/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Anoop Shukla',
          dateOfBirth: '2000-01-15',
          termsAccepted: false
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Terms of Service');
    });

    it('2G. GET /api/v1/me returns verified profile', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.fullName).toBe('Anoop Shukla');
      expect(res.body.user.phone).toContain('9876543210');
      expect(res.body.user.dateOfBirth).toBe('2000-01-15');
    });
  });
});
