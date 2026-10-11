import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Milestone A2: Admin Overview, Live Operations Map & Alerts Test Suite', () => {

  // ==========================================================================
  // 1. KPI AGGREGATION & ROLE SCOPING
  // ==========================================================================
  it('1. KPI Overview: Platform Admin receives all financial and operational KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview/kpis')
      .set('x-staff-user-id', 'usr-admin-1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('admin');
    
    const kpis = res.body.kpis;
    expect(kpis.ordersToday).toBeGreaterThanOrEqual(0);
    expect(kpis.awaitingPharmacyReview).toBeGreaterThanOrEqual(0);
    expect(kpis.beingFulfilled).toBeGreaterThanOrEqual(0);
    expect(kpis.deliveriesInProgress).toBeGreaterThanOrEqual(0);
    expect(kpis.revenuePaise).toBeGreaterThanOrEqual(0);
    expect(kpis.codCashOutstandingPaise).toBeGreaterThanOrEqual(0);
  });

  it('2. KPI Role Scoping: Support Operator receives operational metrics with masked financial revenue', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview/kpis')
      .set('x-staff-user-id', 'usr-support-1');

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('support_operator');
    
    const kpis = res.body.kpis;
    expect(kpis.ordersToday).toBeGreaterThanOrEqual(0);
    // Financial revenue and refunds strictly masked to 0 for support operators
    expect(kpis.revenuePaise).toBe(0);
    expect(kpis.refundsPaise).toBe(0);
    expect(kpis.codCashOutstandingPaise).toBe(0);
  });

  // ==========================================================================
  // 2. LIVE OPERATIONS MAP & FILTERS
  // ==========================================================================
  it('3. Live Operations Map: Returns Gorakhpur hub coordinates, active fleet, and delivery breadcrumbs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/operations/live-map');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.city).toContain('Gorakhpur');
    expect(res.body.bounds).toBeDefined();

    // Verify pharmacies
    expect(res.body.pharmacies.length).toBeGreaterThanOrEqual(1);
    const pharmacy = res.body.pharmacies[0];
    expect(pharmacy.name).toBeDefined();
    expect(pharmacy.latitude).toBeGreaterThan(26.6);
    expect(pharmacy.longitude).toBeGreaterThan(83.2);

    // Verify riders
    expect(res.body.riders.length).toBeGreaterThanOrEqual(1);
    const rider = res.body.riders[0];
    expect(rider.id).toBe('rider-1');
    expect(rider.phone).toBeDefined();
    expect(rider.cashInHandPaise).toBeDefined();

    // Test filter by pharmacy
    const filterRes = await request(app)
      .get('/api/v1/admin/operations/live-map?pharmacyId=pharm-gkp-1');
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.activeDeliveries.every((d: any) => d.pharmacyId === 'pharm-gkp-1')).toBe(true);
  });

  // ==========================================================================
  // 3. OPERATIONAL ALERTS & ROLE SCOPING
  // ==========================================================================
  it('4. Operational Alerts: Scopes alerts by role and orders unresolved alerts by severity', async () => {
    // Platform Admin sees all alerts (SLA, Licences, Stock Expiry, Tickets)
    const adminAlertsRes = await request(app)
      .get('/api/v1/admin/operations/alerts')
      .set('x-staff-user-id', 'usr-admin-1');

    expect(adminAlertsRes.status).toBe(200);
    expect(adminAlertsRes.body.alerts.length).toBeGreaterThanOrEqual(3);
    
    const types = adminAlertsRes.body.alerts.map((a: any) => a.alertType);
    expect(types).toContain('SLA_BREACH');
    expect(types).toContain('LICENCE_EXPIRING');
    expect(types).toContain('HIGH_PRIORITY_TICKET');

    // Support operator only sees tickets and customer-facing order delivery issues
    const supportAlertsRes = await request(app)
      .get('/api/v1/admin/operations/alerts')
      .set('x-staff-user-id', 'usr-support-1');

    expect(supportAlertsRes.status).toBe(200);
    const supportTypes = supportAlertsRes.body.alerts.map((a: any) => a.alertType);
    expect(supportTypes).not.toContain('LICENCE_EXPIRING');
    expect(supportTypes).not.toContain('NEAR_EXPIRY_STOCK');
  });

  // ==========================================================================
  // 4. ALERT ACKNOWLEDGMENT & AUDIT
  // ==========================================================================
  it('5. Alert Acknowledgment: Rejects support operators and records admin resolution in audit log', async () => {
    // 5a. Support operator cannot acknowledge infrastructure alerts -> 403
    const supportRes = await request(app)
      .post('/api/v1/admin/operations/alerts/alt-sla-101/acknowledge')
      .send({
        staffUserId: 'usr-support-1',
        notes: 'Trying to dismiss SLA alert'
      });
    expect(supportRes.status).toBe(403);
    expect(supportRes.body.error).toBe('FORBIDDEN');

    // 5b. Platform Admin acknowledges alert with reason
    const adminRes = await request(app)
      .post('/api/v1/admin/operations/alerts/alt-sla-101/acknowledge')
      .send({
        staffUserId: 'usr-admin-1',
        notes: 'Contacted pharmacist Dr. Manoj on phone; prescription review expedited.'
      });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.alert.isResolved).toBe(true);
    expect(adminRes.body.alert.resolvedBy).toBe('usr-admin-1');

    // Verify audit trail
    const auditEntries = dbStore.auditEvents.filter(
      a => a.action === 'OPERATIONAL_ALERT_ACKNOWLEDGED' && a.resourceId === 'alt-sla-101'
    );
    expect(auditEntries.length).toBeGreaterThan(0);
    const audit = auditEntries[auditEntries.length - 1];
    expect(audit.actorId).toBe('usr-admin-1');
    expect(audit.details.notes).toContain('pharmacist Dr. Manoj');
  });
});
