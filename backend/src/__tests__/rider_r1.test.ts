import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../routes/api';
import { dbStore } from '../store';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

describe('Rider (Delivery Partner) Milestone R1: Auth, Onboarding & Device Binding', () => {
  beforeEach(() => {
    // Reset seed users and riders
    const rider = dbStore.riders.get('rider-1');
    if (rider) {
      rider.isApproved = true;
      rider.approvalStatus = 'approved';
      rider.isAvailable = true;
      rider.currentCashInHand = 0;
    }
  });

  it('1. Enforces No Self-Activation: Rejects unregistered phone number or non-rider role from requesting OTP', async () => {
    // Unknown phone
    const resUnknown = await request(app)
      .post('/api/v1/rider/auth/request-otp')
      .send({ phone: '+919999988888' });

    expect(resUnknown.status).toBe(403);
    expect(resUnknown.body.error).toBe('ACCOUNT_NOT_FOUND_OR_UNAPPROVED');

    // Customer phone (+919876500006) trying to log in as rider
    const resCustomer = await request(app)
      .post('/api/v1/rider/auth/request-otp')
      .send({ phone: '+919876500006' });

    expect(resCustomer.status).toBe(403);
    expect(resCustomer.body.error).toBe('ACCOUNT_NOT_FOUND_OR_UNAPPROVED');
  });

  it('2. OTP Flow: Registered delivery partner can request OTP and login with device binding', async () => {
    // Request OTP for registered rider
    const otpRes = await request(app)
      .post('/api/v1/rider/auth/request-otp')
      .send({ phone: '+919876500005' });

    expect(otpRes.status).toBe(200);
    expect(otpRes.body.success).toBe(true);
    expect(otpRes.body.mockOtp).toBe('123456');

    // Login with device details
    const loginRes = await request(app)
      .post('/api/v1/rider/auth/login')
      .send({
        phone: '+919876500005',
        otp: '123456',
        deviceFingerprint: 'fp-redmi-note11-test',
        deviceModel: 'Xiaomi Redmi Note 11',
        osVersion: 'Android 13',
        appVersion: '1.0.0+1',
        pushToken: 'fcm-token-test-xyz'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.role).toBe('delivery_partner');
    expect(loginRes.body.boundDevices.length).toBeGreaterThan(0);

    const bound = loginRes.body.boundDevices.find(
      (d: any) => d.deviceFingerprint === 'fp-redmi-note11-test'
    );
    expect(bound).toBeDefined();
    expect(bound.deviceModel).toBe('Xiaomi Redmi Note 11');
    expect(bound.isActive).toBe(true);
  });

  it('3. Onboarding Form Validation: Blocks emergency contact matching rider phone and expired driving licence', async () => {
    // Attempt with emergency contact identical to rider phone
    const resBadEmergency = await request(app)
      .post('/api/v1/rider/onboarding/submit')
      .send({
        userId: 'usr-rider-1',
        fullName: 'Vikas Yadav',
        phone: '+919876500005',
        selfieDocPath: '/docs/selfie.jpg',
        govIdType: 'aadhaar',
        govIdNumber: '1234-5678-9012',
        govIdDocPath: '/docs/aadhaar.pdf',
        drivingLicenceNumber: 'UP5320210098765',
        drivingLicenceDocPath: '/docs/dl.pdf',
        drivingLicenceExpiryDate: '2030-01-01',
        vehicleType: 'motorcycle',
        vehicleRegistrationNumber: 'UP53-AB-1234',
        vehicleRcDocPath: '/docs/rc.pdf',
        emergencyContactName: 'Self',
        emergencyContactPhone: '+919876500005', // Same phone!
        emergencyContactRelation: 'Self'
      });

    expect(resBadEmergency.status).toBe(400);
    expect(resBadEmergency.body.error).toBe('EMERGENCY_CONTACT_INVALID');

    // Attempt with past driving licence expiry date
    const resExpiredDL = await request(app)
      .post('/api/v1/rider/onboarding/submit')
      .send({
        userId: 'usr-rider-1',
        fullName: 'Vikas Yadav',
        phone: '+919876500005',
        selfieDocPath: '/docs/selfie.jpg',
        govIdType: 'aadhaar',
        govIdNumber: '1234-5678-9012',
        govIdDocPath: '/docs/aadhaar.pdf',
        drivingLicenceNumber: 'UP5320210098765',
        drivingLicenceDocPath: '/docs/dl.pdf',
        drivingLicenceExpiryDate: '2020-01-01', // Expired!
        vehicleType: 'motorcycle',
        vehicleRegistrationNumber: 'UP53-AB-1234',
        vehicleRcDocPath: '/docs/rc.pdf',
        emergencyContactName: 'Ramesh Yadav',
        emergencyContactPhone: '+919876511111',
        emergencyContactRelation: 'Brother'
      });

    expect(resExpiredDL.status).toBe(400);
    expect(resExpiredDL.body.error).toBe('EXPIRED_LICENCE');
  });

  it('4. Onboarding Submission & Masking: Saves application and masks financial payout credentials', async () => {
    const res = await request(app)
      .post('/api/v1/rider/onboarding/submit')
      .send({
        userId: 'usr-rider-1',
        fullName: 'Vikas Yadav',
        phone: '+919876500005',
        selfieDocPath: '/secure/selfie.jpg',
        govIdType: 'aadhaar',
        govIdNumber: '9999-8888-7777',
        govIdDocPath: '/secure/aadhaar.pdf',
        drivingLicenceNumber: 'UP5320230012345',
        drivingLicenceDocPath: '/secure/dl.pdf',
        drivingLicenceExpiryDate: '2033-05-15',
        vehicleType: 'scooter',
        vehicleRegistrationNumber: 'UP53-CD-5678',
        vehicleRcDocPath: '/secure/rc.pdf',
        emergencyContactName: 'Kailash Yadav',
        emergencyContactPhone: '+919876522222',
        emergencyContactRelation: 'Father',
        bankAccount: '123456789045',
        bankIfsc: 'sbin0000123',
        upiId: 'vikas.rider@oksbi'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.application.bankAccountMasked).toBe('••••••••9045');
    expect(res.body.application.upiIdMasked).toBe('vi••••@oksbi');
    expect(res.body.application.bankIfsc).toBe('SBIN0000123');
    expect(res.body.application.status).toBe('submitted');
  });

  it('5. Admin Review Workflow: Allows admin to review application and approve or request changes', async () => {
    // Review and request changes
    const reviewRes = await request(app)
      .post('/api/v1/admin/rider-applications/app-rider-1/review')
      .send({
        status: 'needs_changes',
        comments: 'RC photo is blurry. Please re-upload clearer image of vehicle registration certificate.'
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.application.status).toBe('needs_changes');
    expect(reviewRes.body.application.reviewerComments).toContain('blurry');

    // Check status API reflects reviewer comments
    const statusRes = await request(app)
      .get('/api/v1/rider/onboarding/status')
      .query({ userId: 'usr-rider-1' });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.approvalStatus).toBe('needs_changes');
    expect(statusRes.body.canGoOnline).toBe(false);
    expect(statusRes.body.reviewerComments).toContain('blurry');
  });

  it('6. Strict Rule: Unapproved rider cannot go online; Approved rider can toggle availability', async () => {
    const rider = dbStore.riders.get('rider-1')!;
    rider.isApproved = false;
    rider.approvalStatus = 'submitted';

    // Attempting to go online when unapproved must fail with 403
    const blockedRes = await request(app)
      .post('/api/v1/rider/availability')
      .send({ riderId: 'rider-1', isAvailable: true });

    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.error).toBe('RIDER_NOT_APPROVED_CANNOT_GO_ONLINE');

    // Admin approves application
    await request(app)
      .post('/api/v1/admin/rider-applications/app-rider-1/review')
      .send({ status: 'approved', comments: 'Documents verified with Parivahan RTO.' });

    // Now rider can go online
    const onlineRes = await request(app)
      .post('/api/v1/rider/availability')
      .send({ riderId: 'rider-1', isAvailable: true });

    expect(onlineRes.status).toBe(200);
    expect(onlineRes.body.isAvailable).toBe(true);

    // Rider can toggle offline
    const offlineRes = await request(app)
      .post('/api/v1/rider/availability')
      .send({ riderId: 'rider-1', isAvailable: false });

    expect(offlineRes.status).toBe(200);
    expect(offlineRes.body.isAvailable).toBe(false);
  });

  it('7. Cash Limit Protection: Rider with excessive cash in hand (>₹5000) cannot go online', async () => {
    const rider = dbStore.riders.get('rider-1')!;
    rider.isApproved = true;
    rider.approvalStatus = 'approved';
    rider.currentCashInHand = 5500; // Above limit

    const limitRes = await request(app)
      .post('/api/v1/rider/availability')
      .send({ riderId: 'rider-1', isAvailable: true });

    expect(limitRes.status).toBe(403);
    expect(limitRes.body.error).toBe('CASH_LIMIT_EXCEEDED');
  });

  it('8. Device Management: Device listing and revocation', async () => {
    // List devices for rider
    const listRes = await request(app)
      .get('/api/v1/rider/devices')
      .query({ userId: 'usr-rider-1' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.devices.length).toBeGreaterThan(0);

    const deviceId = listRes.body.devices[0].id;

    // Revoke device
    const revokeRes = await request(app)
      .post(`/api/v1/rider/devices/${deviceId}/revoke`);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Verify revoked device has isActive: false
    const checkRes = await request(app)
      .get('/api/v1/rider/devices')
      .query({ userId: 'usr-rider-1' });

    const revokedDev = checkRes.body.devices.find((d: any) => d.id === deviceId);
    expect(revokedDev.isActive).toBe(false);
  });
});
