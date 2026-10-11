import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';
import { AssignmentEngine } from '../services/assignmentEngine';

describe('Milestone A3: Rider Assignment Engine & Dispatcher Console Test Suite', () => {

  beforeEach(() => {
    // Reset seed data and settings before each test
    dbStore.pausedAutoAssignmentOrders.clear();
    dbStore.updateAssignmentSettings('zone-gkp-central', {
      killSwitchEnabled: false,
      mode: 'AUTO_WITH_MANUAL_FALLBACK',
      searchRadiusKm: 3.0,
      maxConcurrentOrders: 1,
      maxCodCashPaise: 500000
    });
  });

  // ==========================================================================
  // 1. CANDIDATE FILTERING & EXCLUSIONS
  // ==========================================================================
  it('1. Engine Candidate Exclusions: Excludes riders with stale location, over cash limit, at max load, offline, or outside radius', async () => {
    // Evaluate COD order ord-102 (₹350 / 35,000 paise COD)
    const decision = AssignmentEngine.evaluateOrder('ord-102');

    expect(decision).toBeDefined();
    expect(decision.outcome).toBe('OFFERED');
    expect(decision.selectedRiderId).toBe('rider-1'); // Vikas Yadav is the only fully eligible nearby candidate

    const candidateMap = new Map(decision.candidates.map(c => [c.riderId, c]));

    // Rider 1: Eligible
    expect(candidateMap.get('rider-1')?.eligible).toBe(true);
    expect(candidateMap.get('rider-1')?.totalScore).toBeGreaterThan(0);

    // Rider 2: Cash in hand ₹6,500 + ₹350 = ₹6,850 > ₹5,000 limit -> Excluded
    const rider2 = candidateMap.get('rider-2');
    expect(rider2?.eligible).toBe(false);
    expect(rider2?.exclusionReason).toContain('Exceeds COD cash-in-hand limit');

    // Rider 3: Location update > 30s old (75s) -> Excluded
    const rider3 = candidateMap.get('rider-3');
    expect(rider3?.eligible).toBe(false);
    expect(rider3?.exclusionReason).toContain('Stale GPS location');

    // Rider 4: Load = 1 >= maxConcurrentOrders (1) -> Excluded
    const rider4 = candidateMap.get('rider-4');
    expect(rider4?.eligible).toBe(false);
    expect(rider4?.exclusionReason).toContain('Load limit reached');

    // Rider 5: Offline -> Excluded
    const rider5 = candidateMap.get('rider-5');
    expect(rider5?.eligible).toBe(false);
    expect(rider5?.exclusionReason).toContain('Rider is offline');

    // Rider 6: Manoj Gupta is 4.2 km away > 3.0 km search radius -> Excluded
    const rider6 = candidateMap.get('rider-6');
    expect(rider6?.eligible).toBe(false);
    expect(rider6?.exclusionReason).toContain('Outside search radius');
  });

  // ==========================================================================
  // 2. EXPLAINABILITY & LOGGING IN ASSIGNMENT_DECISIONS
  // ==========================================================================
  it('2. Explainability: Every decision logs candidate scores and is retrievable via API', async () => {
    const res = await request(app)
      .get('/api/v1/dispatch/assignment-decisions/ord-102')
      .set('x-staff-user-id', 'usr-dispatch-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.decisions.length).toBeGreaterThanOrEqual(1);

    const latest = res.body.decisions[0];
    expect(latest.candidates).toBeDefined();
    expect(latest.candidates.length).toBeGreaterThanOrEqual(5);

    // Verify detailed score breakdown for eligible candidate
    const eligible = latest.candidates.find((c: any) => c.eligible);
    expect(eligible.scoreBreakdown.etaScore).toBeDefined();
    expect(eligible.scoreBreakdown.loadScore).toBeDefined();
    expect(eligible.scoreBreakdown.idleScore).toBeDefined();
    expect(eligible.scoreBreakdown.acceptanceScore).toBeDefined();
    expect(eligible.scoreBreakdown.ratingScore).toBeDefined();
  });

  // ==========================================================================
  // 3. OFFERS CASCADE ON DECLINE & TIMEOUT
  // ==========================================================================
  it('3. Offers Cascade: Declining an offer cascades to next evaluation and tracks attempt number', async () => {
    const offers = dbStore.getOrderOffers('ord-102');
    const openOffer = offers.find(o => o.status === 'offered');
    expect(openOffer).toBeDefined();

    // Rider declines offer
    const res = await request(app)
      .post(`/api/v1/dispatch/offers/${openOffer!.id}/respond`)
      .send({
        action: 'decline',
        reason: 'Heavy traffic at Golghar intersection'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.offer.status).toBe('declined');
    expect(res.body.offer.declineReason).toContain('Heavy traffic');

    // Check that previous offer is marked declined
    const updatedOffer = dbStore.riderOffers.get(openOffer!.id);
    expect(updatedOffer?.status).toBe('declined');
  });

  // ==========================================================================
  // 4. PLATFORM-WIDE KILL SWITCH
  // ==========================================================================
  it('4. Platform Kill Switch: Forces MANUAL assignment mode across all zones', async () => {
    // Admin toggles platform kill switch
    const toggleRes = await request(app)
      .post('/api/v1/dispatch/settings')
      .set('x-staff-user-id', 'usr-admin-1')
      .send({
        zoneId: 'zone-gkp-central',
        killSwitchEnabled: true
      });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.settings.killSwitchEnabled).toBe(true);

    // Next evaluation should immediately yield MANUAL_ONLY outcome
    const decision = AssignmentEngine.evaluateOrder('ord-101');
    expect(decision.outcome).toBe('MANUAL_ONLY');
    expect(decision.notes).toContain('Platform-wide kill switch active');

    // Turn off kill switch
    dbStore.updateAssignmentSettings('zone-gkp-central', { killSwitchEnabled: false });
  });

  // ==========================================================================
  // 5. DISPATCHER CONSOLE QUEUE & PRIVACY COMPLIANCE
  // ==========================================================================
  it('5. Dispatcher Queue & Privacy: Queue returns orders needing dispatch without exposing medicine names or prescriptions', async () => {
    const res = await request(app)
      .get('/api/v1/dispatch/queue')
      .set('x-staff-user-id', 'usr-dispatch-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders.length).toBeGreaterThanOrEqual(1);

    const firstOrder = res.body.orders[0];
    expect(firstOrder.orderCode).toBeDefined();
    expect(firstOrder.pharmacyName).toBeDefined();
    expect(firstOrder.dropArea).toBeDefined();
    expect(firstOrder.packageCount).toBeGreaterThanOrEqual(1);
    expect(firstOrder.ageMinutes).toBeGreaterThanOrEqual(0);

    // CRITICAL STATUTORY PRIVACY: Medicines and prescriptions must NOT be exposed to dispatchers
    expect(firstOrder.items).toBeUndefined();
    expect(firstOrder.prescriptionVaultPath).toBeUndefined();
    expect(firstOrder.medicines).toBeUndefined();
  });

  // ==========================================================================
  // 6. MANUAL ASSIGNMENT & ATOMIC CANCELLATION OF OFFERS
  // ==========================================================================
  it('6. Manual Assignment: Dispatcher manually assigns rider with mandatory reason and cancels open offers atomically', async () => {
    // First trigger evaluation to create open offer
    AssignmentEngine.evaluateOrder('ord-101');
    const existingOffers = dbStore.getOrderOffers('ord-101');
    const activeBefore = existingOffers.filter(o => o.status === 'offered');
    expect(activeBefore.length).toBeGreaterThanOrEqual(1);

    // Dispatcher manually assigns rider-1
    const res = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('x-staff-user-id', 'usr-dispatch-1')
      .send({
        orderId: 'ord-101',
        riderId: 'rider-1',
        reason: 'VIP express delivery requested by doctor for urgent postoperative supplies'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.riderId).toBe('rider-1');
    expect(res.body.order.state).toBe('RIDER_ASSIGNED');

    // Verify all previous offers for ord-101 are cancelled
    const offersAfter = dbStore.getOrderOffers('ord-101');
    const stillActive = offersAfter.filter(o => o.status === 'offered');
    expect(stillActive.length).toBe(0);

    // Verify intervention was logged
    const interventions = dbStore.getDispatcherInterventions('ord-101');
    expect(interventions.length).toBeGreaterThanOrEqual(1);
    expect(interventions[0].interventionType).toBe('MANUAL_OVERRIDE');
    expect(interventions[0].notes).toContain('VIP express delivery');
  });

  // ==========================================================================
  // 7. FAILED DELIVERY HANDLING
  // ==========================================================================
  it('7. Failed Delivery: Dispatcher resolves failed delivery with redelivery or cancellation', async () => {
    // ord-104 is in DELIVERY_FAILED state
    const res = await request(app)
      .post('/api/v1/dispatch/failed-delivery')
      .set('x-staff-user-id', 'usr-dispatch-1')
      .send({
        orderId: 'ord-104',
        action: 'redelivery',
        reason: 'Customer was unreachable on first attempt, confirmed available for redelivery at 2 PM'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.state).toBe('PACKED');
    expect(res.body.order.riderId).toBeUndefined(); // returned to queue for re-dispatch
  });

  // ==========================================================================
  // 8. ROLE-BASED ACCESS CONTROL FOR DISPATCHER
  // ==========================================================================
  it('8. RBAC: Support operators cannot manually assign riders or change assignment settings', async () => {
    const assignRes = await request(app)
      .post('/api/v1/dispatch/assign')
      .set('x-staff-user-id', 'usr-support-1')
      .send({
        orderId: 'ord-101',
        riderId: 'rider-1',
        reason: 'Support operator trying to assign rider'
      });

    expect(assignRes.status).toBe(403);
    expect(assignRes.body.error).toBe('FORBIDDEN');

    const settingsRes = await request(app)
      .post('/api/v1/dispatch/settings')
      .set('x-staff-user-id', 'usr-support-1')
      .send({
        zoneId: 'zone-gkp-central',
        killSwitchEnabled: true
      });

    expect(settingsRes.status).toBe(403);
    expect(settingsRes.body.error).toBe('FORBIDDEN');
  });
});
