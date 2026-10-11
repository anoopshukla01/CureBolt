import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../routes/api';
import { dbStore } from '../store';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);

describe('Admin, Dispatcher & Support Dashboard Milestone A1: Auth, RBAC & Approvals', () => {
  beforeEach(() => {
    // Reset admin step-up timestamps
    const admin1 = dbStore.getStaffByUserId('usr-admin-1');
    if (admin1) admin1.lastStepUpAt = new Date().toISOString();
    const admin2 = dbStore.getStaffByUserId('usr-admin-2');
    if (admin2) admin2.lastStepUpAt = new Date().toISOString();
  });

  it('1. Staff Authentication: Requires active email and valid TOTP code', async () => {
    // Invalid TOTP
    const resBadOtp = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@medcure.in', totpCode: '000000' });

    expect(resBadOtp.status).toBe(401);
    expect(resBadOtp.body.error).toBe('INVALID_TOTP');

    // Unknown email
    const resBadEmail = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'stranger@gmail.com', totpCode: '123456' });

    expect(resBadEmail.status).toBe(403);
    expect(resBadEmail.body.error).toBe('ACCOUNT_NOT_AUTHORIZED');

    // Successful Admin Login
    const resSuccess = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'admin@medcure.in', totpCode: '123456' });

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.token).toBeDefined();
    expect(resSuccess.body.staff.role).toBe('admin');
    expect(resSuccess.body.permissions.canManageCatalogue).toBe(true);
    expect(resSuccess.body.permissions.canBreakGlassPrescriptions).toBe(true);
  });

  it('2. RBAC Permissions Matrix: Dispatches distinct operational scopes for Admin, Dispatcher, Support', async () => {
    // Dispatcher
    const dispatchRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'dispatch@medcure.in', totpCode: '123456' });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body.permissions.role).toBe('dispatcher');
    expect(dispatchRes.body.permissions.canAssignRiders).toBe(true);
    expect(dispatchRes.body.permissions.canBreakGlassPrescriptions).toBe(false);
    expect(dispatchRes.body.permissions.canManageCatalogue).toBe(false);
    expect(dispatchRes.body.permissions.canViewCustomerPII).toBe('delivery_only');

    // Support Operator
    const supportRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: 'support@medcure.in', totpCode: '123456' });

    expect(supportRes.status).toBe(200);
    expect(supportRes.body.permissions.role).toBe('support_operator');
    expect(supportRes.body.permissions.canResolveTickets).toBe(true);
    expect(supportRes.body.permissions.canAssignRiders).toBe(false);
    expect(supportRes.body.permissions.canBreakGlassPrescriptions).toBe(false);
    expect(supportRes.body.permissions.canViewCustomerPII).toBe('masked_phone');
  });

  it('3. Staff Creation: Platform admin can create accounts with mandatory stated reason', async () => {
    // Non-admin attempting to create staff
    const resBlocked = await request(app)
      .post('/api/v1/admin/staff/create')
      .send({
        adminUserId: 'usr-dispatch-1',
        fullName: 'New Dispatcher',
        email: 'newdispatch@medcure.in',
        phone: '+919876543210',
        role: 'dispatcher',
        reason: 'Adding night shift dispatcher'
      });

    expect(resBlocked.status).toBe(403);
    expect(resBlocked.body.error).toBe('FORBIDDEN');

    // Admin creates staff
    const resSuccess = await request(app)
      .post('/api/v1/admin/staff/create')
      .send({
        adminUserId: 'usr-admin-1',
        fullName: 'Pawan Kumar',
        email: 'pawan.dispatch@medcure.in',
        phone: '+919876543210',
        role: 'dispatcher',
        reason: 'Authorized for Gorakhpur evening flight dispatch coverage'
      });

    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.staff.email).toBe('pawan.dispatch@medcure.in');
    expect(resSuccess.body.staff.role).toBe('dispatcher');
  });

  it('4. Two-Person Approval Core Rule: Requester cannot approve their own high-risk configuration change', async () => {
    // Admin 1 submits request to toggle OTC_DIRECT flag on prescription medicine
    const reqRes = await request(app)
      .post('/api/v1/admin/approvals/request')
      .send({
        requestedBy: 'usr-admin-1',
        actionType: 'OTC_DIRECT_TOGGLE',
        targetResourceId: 'prd-amox-500',
        reason: 'Statutory schedule H review by CDSCO',
        payload: { allowDirectOtc: false }
      });

    expect(reqRes.status).toBe(200);
    const approvalId = reqRes.body.approval.id;

    // Admin 1 attempts to approve their OWN request (MUST FAIL)
    const selfApproveRes = await request(app)
      .post(`/api/v1/admin/approvals/${approvalId}/decide`)
      .send({
        decidedBy: 'usr-admin-1', // Same user!
        decision: 'approved',
        reason: 'Self approval attempt'
      });

    expect(selfApproveRes.status).toBe(400);
    expect(selfApproveRes.body.error).toContain('TWO_PERSON_VIOLATION');

    // Admin 2 (second human) approves request
    const secondApproveRes = await request(app)
      .post(`/api/v1/admin/approvals/${approvalId}/decide`)
      .send({
        decidedBy: 'usr-admin-2',
        decision: 'approved',
        reason: 'Verified against Drug & Cosmetics Act Schedule H amendment.'
      });

    expect(secondApproveRes.status).toBe(200);
    expect(secondApproveRes.body.approval.status).toBe('approved');
    expect(secondApproveRes.body.approval.approvedBy).toBe('usr-admin-2');
  });

  it('5. Prescription Break-Glass Access: Restricted to Admin with stated reason & step-up; forbidden for Dispatcher/Support', async () => {
    // Dispatcher attempts break glass
    const dispatchBlocked = await request(app)
      .post('/api/v1/admin/prescriptions/rx-sample-123/break-glass')
      .send({
        staffUserId: 'usr-dispatch-1',
        reason: 'Need to see prescription for rider question'
      });

    expect(dispatchBlocked.status).toBe(403);
    expect(dispatchBlocked.body.error).toBe('ROLE_FORBIDDEN');

    // Support attempts break glass
    const supportBlocked = await request(app)
      .post('/api/v1/admin/prescriptions/rx-sample-123/break-glass')
      .send({
        staffUserId: 'usr-support-1',
        reason: 'Customer complaint investigation'
      });

    expect(supportBlocked.status).toBe(403);
    expect(supportBlocked.body.error).toBe('ROLE_FORBIDDEN');

    // Admin opens break glass with valid justification
    const adminSuccess = await request(app)
      .post('/api/v1/admin/prescriptions/rx-sample-123/break-glass')
      .send({
        staffUserId: 'usr-admin-1',
        reason: 'Court order / UP Drug Inspector query regarding dispensing batch record #UP2026-99',
        totpCode: '123456'
      });

    expect(adminSuccess.status).toBe(200);
    expect(adminSuccess.body.session).toBeDefined();
    expect(adminSuccess.body.session.statedReason).toContain('Drug Inspector');
    expect(adminSuccess.body.prescription).toBeDefined();

    // Verify audit log has recorded the event
    const auditRes = await request(app).get('/api/v1/admin/audit-logs');
    const bgAudit = auditRes.body.logs.find(
      (l: any) => l.action === 'BREAK_GLASS_PRESCRIPTION_ACCESS'
    );
    expect(bgAudit).toBeDefined();
    expect(bgAudit.details.statedReason).toContain('Drug Inspector');
  });
});
