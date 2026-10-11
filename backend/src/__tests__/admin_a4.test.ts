import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Admin Milestone A4: Pharmacy and Rider Management, Compliance & Settlements', () => {
  beforeEach(() => {
    // Reset seed data
    (dbStore as any).seedGorakhpurData();
  });

  it('1. Pharmacy Application Review: Blocks approval if checklist is incomplete, succeeds when verified', async () => {
    // 1. Fetch applications queue
    const listRes = await request(app).get('/api/v1/admin/pharmacy-applications');
    expect(listRes.status).toBe(200);
    expect(listRes.body.applications.length).toBeGreaterThanOrEqual(2);

    const pendingApp = listRes.body.applications.find((a: any) => a.id === 'app-pharma-2');
    expect(pendingApp).toBeDefined();
    expect(pendingApp.status).toBe('submitted');

    // 2. Try to approve directly while checklist is incomplete (all false)
    const failApprove = await request(app)
      .post('/api/v1/admin/pharmacy-applications/app-pharma-2/decide')
      .send({
        decision: 'APPROVE',
        reason: 'Attempting to approve without document inspection'
      });

    expect(failApprove.status).toBe(400);
    expect(failApprove.body.message).toContain('All 5 statutory verification checklist items must be verified');

    // 3. Update checklist with verified statutory credentials
    const updateChecklist = await request(app)
      .put('/api/v1/admin/pharmacy-applications/app-pharma-2/checklist')
      .send({
        licenceValidityVerified: true,
        registrationVerified: true,
        physicalAddressVerified: true,
        authorisedPersonsVerified: true,
        pharmacistCredentialsVerified: true,
        verificationNotes: 'Verified with UP Drug Control portal & physical premises inspected.'
      });

    expect(updateChecklist.status).toBe(200);
    expect(updateChecklist.body.checklist.licenceValidityVerified).toBe(true);
    expect(updateChecklist.body.checklist.pharmacistCredentialsVerified).toBe(true);

    // 4. Now approve application with valid reason
    const approveRes = await request(app)
      .post('/api/v1/admin/pharmacy-applications/app-pharma-2/decide')
      .send({
        decision: 'APPROVE',
        reason: 'Form 20/21 valid, registered pharmacist credentials confirmed with UP Pharmacy Council.'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('verified');

    // Check that pharmacy is activated in system
    const pharma = dbStore.pharmacies.get('pharm-gkp-2');
    expect(pharma).toBeDefined();
    expect(pharma?.isActive).toBe(true);
    expect(pharma?.isVerified).toBe(true);

    // Commission should be initialized
    const comm = dbStore.getPharmacyCommission('pharm-gkp-2');
    expect(comm).toBeDefined();
    expect(comm.commissionRatePct).toBe(8.5);
  });

  it('2. Pharmacy Lifecycle Controls: Suspend immediately affects catalogue & order routing, Reinstate restores', async () => {
    // Check initial state
    const pharma = dbStore.pharmacies.get('pharm-gkp-1')!;
    expect(pharma.isActive).toBe(true);

    // Suspend pharmacy
    const suspendRes = await request(app)
      .post('/api/v1/admin/pharmacies/pharm-gkp-1/lifecycle')
      .send({
        action: 'SUSPEND',
        reason: 'Temporary regulatory audit required following packaging inspection notice.'
      });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.pharmacy.isActive).toBe(false);

    // Verify pharmacy is now inactive in dbStore
    expect(dbStore.pharmacies.get('pharm-gkp-1')?.isActive).toBe(false);

    // Audit trail should record suspension with reason
    const audit = dbStore.auditEvents.find(a => a.action === 'PHARMACY_SUSPEND' && a.resourceId === 'pharm-gkp-1');
    expect(audit).toBeDefined();
    expect(audit?.details.reason).toContain('Temporary regulatory audit');

    // Reinstate pharmacy
    const reinstateRes = await request(app)
      .post('/api/v1/admin/pharmacies/pharm-gkp-1/lifecycle')
      .send({
        action: 'REINSTATE',
        reason: 'Audit resolved with clean compliance report from drug inspector.'
      });

    expect(reinstateRes.status).toBe(200);
    expect(reinstateRes.body.pharmacy.isActive).toBe(true);
  });

  it('3. Licence Expiry Tracker & Auto-Hide: Flags status and automatically deactivates expired pharmacies', async () => {
    // 1. Get tracker list
    const trackerRes = await request(app).get('/api/v1/admin/pharmacies/licence-tracker');
    expect(trackerRes.status).toBe(200);
    expect(trackerRes.body.licences.length).toBeGreaterThanOrEqual(1);

    // 2. Set an application licence to past date
    const appRecord = dbStore.onboardingApplications.get('app-gkp-1')!;
    appRecord.licenceExpiryDate = '2025-12-31'; // Expired date

    // 3. Trigger auto-hide enforcement
    const enforceRes = await request(app).post('/api/v1/admin/pharmacies/enforce-licence-expiries');
    expect(enforceRes.status).toBe(200);
    expect(enforceRes.body.expiredCount).toBeGreaterThanOrEqual(1);

    // Pharmacy should now be auto-hidden (isActive = false)
    expect(dbStore.pharmacies.get('pharm-gkp-1')?.isActive).toBe(false);

    // Operational alert for expired licence should be created
    const alert = dbStore.operationalAlerts.get('alt-lic-exp-pharm-gkp-1');
    expect(alert).toBeDefined();
    expect(alert?.alertType).toBe('LICENCE_EXPIRING');
    expect(alert?.severity).toBe('critical');
  });

  it('4. Pharmacy Commission & Scorecard: Inspects and updates commission rules, retrieves performance scorecard', async () => {
    // 1. Get commission settings
    const commRes = await request(app).get('/api/v1/admin/pharmacies/pharm-gkp-1/commission');
    expect(commRes.status).toBe(200);
    expect(commRes.body.commission.commissionRatePct).toBe(8.5);

    // 2. Update commission settings
    const updateRes = await request(app)
      .put('/api/v1/admin/pharmacies/pharm-gkp-1/commission')
      .send({
        commissionRatePct: 9.5,
        fixedPlatformFeePaise: 2000,
        payoutCycle: 'BIWEEKLY'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.commission.commissionRatePct).toBe(9.5);
    expect(updateRes.body.commission.fixedPlatformFeePaise).toBe(2000);
    expect(updateRes.body.commission.payoutCycle).toBe('BIWEEKLY');

    // 3. Get scorecard
    const scoreRes = await request(app).get('/api/v1/admin/pharmacies/pharm-gkp-1/scorecard');
    expect(scoreRes.status).toBe(200);
    expect(scoreRes.body.scorecard.acceptanceRate).toBeGreaterThan(90);
    expect(scoreRes.body.scorecard.stockAccuracyRate).toBeGreaterThan(95);
    expect(scoreRes.body.scorecard.rejectionReasons).toBeDefined();

    // 4. Get staff list
    const staffRes = await request(app).get('/api/v1/admin/pharmacies/pharm-gkp-1/staff');
    expect(staffRes.status).toBe(200);
    expect(staffRes.body.staff.length).toBeGreaterThan(0);
  });

  it('5. Pharmacy Compliance Exceptions: Logs and resolves compliance discrepancies with audit notes', async () => {
    // 1. Log a new exception
    const createRes = await request(app)
      .post('/api/v1/admin/pharmacy-exceptions')
      .send({
        pharmacyId: 'pharm-gkp-1',
        exceptionType: 'MISSING_PHARMACIST_SIGNATURE',
        severity: 'MEDIUM',
        description: 'Physical dispensing register missing counter-signature on evening shift.'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.exception.isResolved).toBe(false);
    const exceptionId = createRes.body.exception.id;

    // 2. Resolve the exception
    const resolveRes = await request(app)
      .post(`/api/v1/admin/pharmacy-exceptions/${exceptionId}/resolve`)
      .send({
        resolutionNotes: 'Supervising pharmacist reviewed prescription record and signed the manual register.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.exception.isResolved).toBe(true);
    expect(resolveRes.body.exception.resolutionNotes).toContain('signed the manual register');
  });

  it('6. Rider Onboarding & Statutory Review: Validates checklist requirements, approves and suspends riders', async () => {
    // 1. Try to approve rider without verified checklist
    const failRes = await request(app)
      .post('/api/v1/admin/rider-applications/app-rider-2/decide')
      .send({
        decision: 'APPROVE',
        reason: 'Attempting approval without DL check'
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.message).toContain('All 4 verification checklist items');

    // 2. Update rider verification checklist
    const chkRes = await request(app)
      .put('/api/v1/admin/rider-applications/app-rider-2/checklist')
      .send({
        drivingLicenceVerified: true,
        vehicleRcVerified: true,
        identityVerified: true,
        backgroundCheckCleared: true,
        verificationNotes: 'DL UP53-2022009812 verified via Sarathi API. Aadhaar KYC verified.'
      });

    expect(chkRes.status).toBe(200);
    expect(chkRes.body.checklist.drivingLicenceVerified).toBe(true);

    // 3. Approve rider
    const approveRes = await request(app)
      .post('/api/v1/admin/rider-applications/app-rider-2/decide')
      .send({
        decision: 'APPROVE',
        reason: 'All vehicle and driving documents verified successfully.'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('approved');

    // 4. Suspend rider
    const suspendRes = await request(app)
      .post('/api/v1/admin/rider-applications/app-rider-2/decide')
      .send({
        decision: 'SUSPEND',
        reason: 'Vehicle breakdown reported by rider.'
      });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.status).toBe('suspended');
  });

  it('7. Rider Cash Deposits (COD Reconciliation): Atomically deducts cash-in-hand upon admin confirmation', async () => {
    // Check initial rider cash in presence
    const presence = dbStore.riderPresence.get('rider-1')!;
    const initialCash = presence.currentCashInHandPaise;
    expect(initialCash).toBeGreaterThan(0);

    // 1. Submit deposit for ₹800 (80,000 paise)
    const depositRes = await request(app)
      .post('/api/v1/admin/rider-cash-deposits')
      .send({
        riderId: 'rider-1',
        amountPaise: 80000,
        depositMethod: 'UPI_TRANSFER',
        referenceNumber: 'UPI/GKP/TEST/12345',
        notes: 'Evening cash handover via platform QR'
      });

    expect(depositRes.status).toBe(201);
    expect(depositRes.body.deposit.status).toBe('SUBMITTED');
    const depositId = depositRes.body.deposit.id;

    // 2. Admin confirms deposit
    const confirmRes = await request(app)
      .post(`/api/v1/admin/rider-cash-deposits/${depositId}/confirm`)
      .send({});

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.deposit.status).toBe('CONFIRMED');
    expect(confirmRes.body.updatedCashInHandPaise).toBe(initialCash - 80000);
    expect(presence.currentCashInHandPaise).toBe(initialCash - 80000);
  });

  it('8. Rider Payout Batches: Generates period batch and exports as CSV and JSON', async () => {
    // 1. Generate new payout batch
    const genRes = await request(app)
      .post('/api/v1/admin/rider-payouts/generate')
      .send({
        periodStart: '2026-01-08',
        periodEnd: '2026-01-14'
      });

    expect(genRes.status).toBe(201);
    expect(genRes.body.batch.items.length).toBeGreaterThan(0);
    expect(genRes.body.batch.totalAmountPaise).toBeGreaterThan(0);
    const batchId = genRes.body.batch.id;

    // 2. Export as JSON
    const exportJson = await request(app)
      .get(`/api/v1/admin/rider-payouts/${batchId}/export`)
      .query({ format: 'json' });

    expect(exportJson.status).toBe(200);
    expect(exportJson.header['content-type']).toContain('application/json');

    // 3. Export as CSV
    const exportCsv = await request(app)
      .get(`/api/v1/admin/rider-payouts/${batchId}/export`)
      .query({ format: 'csv' });

    expect(exportCsv.status).toBe(200);
    expect(exportCsv.header['content-type']).toContain('text/csv');
    expect(exportCsv.text).toContain('Rider ID,Rider Name,Phone');
  });
});
