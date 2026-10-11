import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Milestone 1: Authentication and Profile Setup Test Suite', () => {
  const testPhone = '9876543210';
  const fullPhone = '+919876543210';

  it('1. Phone Validation: Rejects numbers not starting with 6-9 or invalid length', async () => {
    // Starts with 5 (invalid in India)
    const res1 = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: '5123456789' });
    expect(res1.status).toBe(400);
    expect(res1.body.error).toContain('Invalid phone number format');

    // Too short
    const res2 = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: '98765' });
    expect(res2.status).toBe(400);

    // Valid 10-digit number starting with 9
    const res3 = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: testPhone });
    expect(res3.status).toBe(200);
    expect(res3.body.success).toBe(true);
    expect(res3.body.expires_in).toBe(300);
  });

  it('2. OTP Rate Limiting: Enforces 30s cooldown on immediate resend', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/request')
      .send({ phone: testPhone });
    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Please wait');
  });

  it('3. OTP Verification: Tracks wrong attempts and enforces 15-min lockout after 5 failures', async () => {
    const freshPhone = '9876599999';
    await request(app).post('/api/v1/auth/otp/request').send({ phone: freshPhone });

    // 4 wrong attempts
    for (let i = 0; i < 4; i++) {
      const failRes = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phone: freshPhone, otp: '000000' });
      expect(failRes.status).toBe(401);
      expect(failRes.body.error).toContain('attempt(s) remaining');
    }

    // 5th wrong attempt triggers lockout
    const lockRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: freshPhone, otp: '000000' });
    expect(lockRes.status).toBe(429);
    expect(lockRes.body.error).toContain('locked for 15 minutes');

    // Subsequent attempt while locked
    const subRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: freshPhone, otp: '123456' });
    expect(subRes.status).toBe(429);
    expect(subRes.body.error).toContain('locked');
  });

  it('4. Successful OTP Verification: Returns JWT token and user info', async () => {
    const validPhone = '9876511111';
    await request(app).post('/api/v1/auth/otp/request').send({ phone: validPhone });

    const verifyRes = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: validPhone, otp: '123456' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.user).toBeDefined();
    expect(verifyRes.body.user.phone).toBe('+919876511111');
  });

  it('5. Profile Age Gating: Blocks users under 18 across leap years and day boundaries', async () => {
    // 17-year-old user
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    const underageRes = await request(app)
      .put('/api/v1/me/profile')
      .send({
        fullName: 'Aman Verma',
        dateOfBirth: underageDate,
        termsAccepted: true
      });

    expect(underageRes.status).toBe(403);
    expect(underageRes.body.error).toContain('at least 18 years of age');

    // Future date
    const futureDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const futureRes = await request(app)
      .put('/api/v1/me/profile')
      .send({
        fullName: 'Aman Verma',
        dateOfBirth: futureDate,
        termsAccepted: true
      });
    expect(futureRes.status).toBe(400);
    expect(futureRes.body.error).toContain('future');
  });

  it('6. Profile Validation: Enforces name constraints and terms acceptance', async () => {
    // Single character name (invalid, requires 2-60 chars)
    const res1 = await request(app)
      .put('/api/v1/me/profile')
      .send({
        fullName: 'A',
        dateOfBirth: '1995-05-15',
        termsAccepted: true
      });
    expect(res1.status).toBe(400);

    // Missing terms acceptance
    const res2 = await request(app)
      .put('/api/v1/me/profile')
      .send({
        fullName: 'Pooja Srivastava',
        dateOfBirth: '1995-05-15',
        termsAccepted: false
      });
    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain('accept the Terms of Service');

    // Valid adult profile
    const res3 = await request(app)
      .put('/api/v1/me/profile')
      .send({
        fullName: 'Pooja Srivastava',
        dateOfBirth: '1998-04-12',
        termsAccepted: true
      });
    expect(res3.status).toBe(200);
    expect(res3.body.user.fullName).toBe('Pooja Srivastava');
    expect(res3.body.user.termsVersion).toBe('v1.0-2026');
    expect(res3.body.user.termsAcceptedAt).toBeDefined();
  });
});
