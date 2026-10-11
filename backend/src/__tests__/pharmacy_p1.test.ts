import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Milestone P1: Merchant Auth, Onboarding & Licence Verification', () => {
  it('1. Role-Based Login: Grants correct capabilities to Owner, Pharmacist, and Staff', async () => {
    // 1A. Owner Login
    const ownerRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')
      .send({ phoneOrEmail: '+919876500002', role: 'pharmacy_owner' });
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.token).toBeDefined();
    expect(ownerRes.body.role).toBe('pharmacy_owner');
    expect(ownerRes.body.capabilities.canManageStaff).toBe(true);
    expect(ownerRes.body.capabilities.canViewReports).toBe(true);

    // 1B. Pharmacist Login
    const pharmaRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')
      .send({ phoneOrEmail: '+919876500003', role: 'pharmacist' });
    expect(pharmaRes.status).toBe(200);
    expect(pharmaRes.body.role).toBe('pharmacist');
    expect(pharmaRes.body.capabilities.canReviewPrescriptions).toBe(true);
    expect(pharmaRes.body.capabilities.canManageStaff).toBe(false);

    // 1C. Staff Login
    const staffRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')
      .send({ phoneOrEmail: '+919876500004', role: 'pharmacy_staff' });
    expect(staffRes.status).toBe(200);
    expect(staffRes.body.role).toBe('pharmacy_staff');
    expect(staffRes.body.capabilities.canReviewPrescriptions).toBe(false);
    expect(staffRes.body.capabilities.canManageStaff).toBe(false);

    // 1D. Unauthorized Customer blocked
    const custRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')
      .send({ phoneOrEmail: '+919876500006' });
    expect(custRes.status).toBe(403);
    expect(custRes.body.error).toContain('Access denied');
  });

  it('2. Onboarding Lifecycle: Draft -> Submit -> Admin Verification activates pharmacy', async () => {
    // 2A. Create Draft Application
    const draftPayload = {
      businessName: 'Shukla Medicos & Vet Care',
      legalEntityName: 'M/S Shukla Healthcare Pvt Ltd',
      gstin: '09AABCS1234F1Z1',
      addressLine1: 'Civil Lines, Gorakhpur',
      city: 'Gorakhpur',
      pincode: '273001',
      latitude: 26.7580,
      longitude: 83.3750,
      authorisedRepresentativeName: 'Anoop Shukla',
      authorisedRepresentativePhone: '+919876500099',
      licenceForm20: 'UP-GKP-20-998877',
      licenceForm21: 'UP-GKP-21-998878',
      licenceExpiryDate: '2028-05-30',
      pharmacistName: 'Ramesh Chandra',
      pharmacistRegNumber: 'UP-PH-99120',
      pharmacistCouncil: 'Uttar Pradesh Pharmacy Council'
    };

    const draftRes = await request(app)
      .post('/api/v1/pharmacy/onboarding/application')
      .send(draftPayload);
    expect(draftRes.status).toBe(201);
    const appId = draftRes.body.application.id;
    expect(draftRes.body.application.status).toBe('draft');

    // 2B. Submit Application
    const submitRes = await request(app)
      .post('/api/v1/pharmacy/onboarding/submit')
      .send({ applicationId: appId });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.application.status).toBe('submitted');

    // 2C. Admin Approval & Verification
    const reviewRes = await request(app)
      .post(`/api/v1/admin/pharmacy-applications/${appId}/review`)
      .send({
        status: 'verified',
        reviewerComments: 'Inspected premises and verified Form 20/21 with UP FDA portal.'
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.application.status).toBe('verified');
  });

  it('3. Licence Expiry Monitoring: Detects validity and computes statutory alerts', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/onboarding/application?pharmacyId=pharm-gkp-1');
    expect(res.status).toBe(200);
    expect(res.body.application).toBeDefined();
    expect(res.body.licenceStatus).toBeDefined();
    expect(res.body.licenceStatus.daysUntilExpiry).toBeGreaterThan(0);
    expect(res.body.licenceStatus.isExpired).toBe(false);
  });

  it('4. Session Management: Logout and revoke-all-sessions terminates tokens', async () => {
    const loginRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')
      .send({ phoneOrEmail: '+919876500002', role: 'pharmacy_owner', deviceInfo: 'Counter Terminal #1' });
    const token = loginRes.body.token;
    const userId = loginRes.body.user.id;

    // Check sessions
    const sessionsRes = await request(app)
      .get('/api/v1/pharmacy/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', userId);
    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.sessions).toBeInstanceOf(Array);
    expect(sessionsRes.body.sessions.length).toBeGreaterThan(0);

    // Revoke all sessions ("Sign out everywhere")
    const revokeRes = await request(app)
      .post('/api/v1/pharmacy/auth/revoke-all-sessions')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', userId);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/pharmacy/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });
});
