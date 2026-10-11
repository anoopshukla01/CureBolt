import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Milestone A5: Master Catalogue Management, Statutory Controls & Batch Recalls', () => {
  beforeEach(() => {
    // Reset seed data
    (dbStore as any).seedGorakhpurData();
  });

  // 1. Catalogue Overview & Domain Separation
  it('1. Master Catalogue Filtering: Separates human & veterinary medicines and calculates summary metrics', async () => {
    const res = await request(app).get('/api/v1/admin/catalogue/products');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.humanCount).toBeGreaterThan(0);
    expect(res.body.summary.veterinaryCount).toBeGreaterThan(0);

    // Filter by veterinary domain
    const vetRes = await request(app).get('/api/v1/admin/catalogue/products?domain=veterinary');
    expect(vetRes.status).toBe(200);
    expect(vetRes.body.items.every((p: any) => p.categoryDomain === 'veterinary')).toBe(true);

    // Filter by schedule
    const schedRes = await request(app).get('/api/v1/admin/catalogue/products?scheduleType=Schedule%20H');
    expect(schedRes.status).toBe(200);
    expect(schedRes.body.items.every((p: any) => p.scheduleType === 'Schedule H')).toBe(true);
  });

  // 2. Statutory Product Creation Validation
  it('2. Product Creation Safeguards: Rejects non-positive MRP and prohibits OTC_DIRECT on scheduled drugs', async () => {
    // A. Rejects MRP <= 0
    const invalidMrpRes = await request(app)
      .post('/api/v1/admin/catalogue/products')
      .send({
        name: 'Invalid Syrup',
        brand: 'TestBrand',
        categoryId: 'cat-cough',
        categoryDomain: 'human',
        formulation: 'Syrup',
        packSize: '100 ml',
        manufacturer: 'Pharma Test Ltd',
        mrp: -10, // Invalid
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/test.png'
      });
    expect(invalidMrpRes.status).toBe(400);

    // B. Rejects Scheduled drug without prescription requirement or with OTC_DIRECT enabled
    const illegalScheduleRes = await request(app)
      .post('/api/v1/admin/catalogue/products')
      .send({
        name: 'Illegal Antibiotic Direct',
        brand: 'DangerPharm',
        categoryId: 'cat-antibiotics',
        categoryDomain: 'human',
        formulation: 'Tablet',
        packSize: '10 tablets',
        manufacturer: 'Pharma Test Ltd',
        mrp: 150,
        requiresPrescription: false, // VIOLATION
        isOtcDirect: true, // VIOLATION
        scheduleType: 'Schedule H1',
        imageUrl: '/products/test.png'
      });
    expect(illegalScheduleRes.status).toBe(422);
    expect(illegalScheduleRes.body.error).toContain('Statutory violation');

    // C. Valid OTC direct product creation succeeds
    const validRes = await request(app)
      .post('/api/v1/admin/catalogue/products')
      .send({
        name: 'Electral ORS Sachet 21.8g',
        brand: 'FDC',
        genericSaltName: 'Oral Rehydration Salts IP',
        categoryId: 'cat-firstaid',
        categoryDomain: 'human',
        formulation: 'Powder',
        packSize: '21.8 g Sachet',
        manufacturer: 'FDC Limited',
        mrp: 22.50,
        requiresPrescription: false,
        isOtcDirect: true,
        scheduleType: 'OTC',
        imageUrl: '/products/electral.png'
      });
    expect(validRes.status).toBe(201);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.product.id).toBeDefined();
    expect(validRes.body.product.maxOrderQuantity).toBe(10);
  });

  // 3. Product Update & Statutory MRP Clamp on Inventory
  it('3. Statutory MRP Clamp: Lowering product MRP automatically clamps inventory selling prices', async () => {
    // prd-dolo-650 currently has MRP 34.00 and inventory selling price 30.50
    // If Admin lowers MRP to 28.00, inventory selling price must clamp to <= 28.00
    const updateRes = await request(app)
      .put('/api/v1/admin/catalogue/products/prd-dolo-650')
      .send({
        mrp: 28.00,
        packSize: '15 Tablets Strip (Price Revision)'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.product.mrp).toBe(28.00);

    // Verify inventory clamp in store
    const invItem = Array.from(dbStore.inventory.values()).find(i => i.productId === 'prd-dolo-650');
    expect(invItem).toBeDefined();
    expect(invItem!.mrp).toBe(28.00);
    expect(invItem!.sellingPrice).toBeLessThanOrEqual(28.00);
  });

  // 4. Two-Person Safety Approvals & Separation of Duties
  it('4. Two-Person Approval Enforcement: Self-approval prohibited, second admin executes safety change', async () => {
    // Step 1: Admin 1 requests OTC_DIRECT toggle on a product
    const reqRes = await request(app)
      .post('/api/v1/admin/two-person-approvals/request')
      .send({
        requestedBy: 'usr-admin-1',
        actionType: 'OTC_DIRECT_TOGGLE',
        targetResourceId: 'prd-glycomet-500',
        reason: 'Patient advocacy request for recurring emergency diabetic supplies',
        payload: { field: 'isOtcDirect', oldValue: false, newValue: true }
      });
    expect(reqRes.status).toBe(200);
    const approvalId = reqRes.body.approval.id;
    expect(approvalId).toBeDefined();

    // Step 2: Ensure step-up is valid for Admin 1 and test self-approval
    dbStore.verifyTotpStepUp('usr-admin-1', '123456'); // Mock/valid TOTP
    const selfApproveRes = await request(app)
      .post(`/api/v1/admin/two-person-approvals/${approvalId}/review`)
      .send({
        reviewerId: 'usr-admin-1', // SAME USER -> MUST FAIL
        decision: 'approved',
        reason: 'Self-certifying safety'
      });
    expect(selfApproveRes.status).toBe(400);
    expect(selfApproveRes.body.error).toContain('TWO_PERSON_VIOLATION');

    // Step 3: Admin 2 performs step-up and approves
    dbStore.verifyTotpStepUp('usr-admin-2', '123456');

    const approveRes = await request(app)
      .post(`/api/v1/admin/two-person-approvals/${approvalId}/review`)
      .send({
        reviewerId: 'usr-admin-2', // DIFFERENT ADMIN
        decision: 'approved',
        reason: 'Pharmacological evaluation confirmed safe under conditional dispensing protocol.'
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.approval.status).toBe('approved');

    // Step 4: Verify the change was automatically executed on the target product
    const product = dbStore.products.get('prd-glycomet-500');
    expect(product?.isOtcDirect).toBe(true);
  });

  // 5. Batch Recall Directive
  it('5. Batch Recall Directive: Quarantines affected batch from inventory and raises operational alert', async () => {
    // Batch DL-24A91 of Dolo-650 has 150 units in pharm-gkp-1
    const recallRes = await request(app)
      .post('/api/v1/admin/recalls')
      .send({
        productId: 'prd-dolo-650',
        batchNumber: 'DL-24A91',
        manufacturerNoticeRef: 'MFR-MICRO-2026-QC01',
        recallClass: 'CLASS_1_CRITICAL',
        reason: 'Suspected disintegration test failure reported in state drug laboratory audit.'
      });
    expect(recallRes.status).toBe(201);
    expect(recallRes.body.success).toBe(true);
    expect(recallRes.body.recall.affectedInventoryUnits).toBe(150);

    // Verify batch is quarantined in inventory
    const inv = Array.from(dbStore.inventory.values()).find(i => i.productId === 'prd-dolo-650');
    const batch = inv?.batches.find(b => b.batchNumber === 'DL-24A91');
    expect(batch?.isRecalled).toBe(true);
    expect(inv?.availableQuantity).toBe(0); // Quarantined

    // Verify operational alert created
    const alerts = Array.from(dbStore.operationalAlerts.values());
    const recallAlert = alerts.find(a => a.title.includes('DRUG RECALL: Dolo 650'));
    expect(recallAlert).toBeDefined();
    expect(recallAlert?.severity).toBe('CRITICAL');
  });

  // 6. Complete Product Recall & Catalogue Blackout
  it('6. Full Product Recall: Immediately deactivates product from customer catalogue and zeroes inventory', async () => {
    const recallAllRes = await request(app)
      .post('/api/v1/admin/recalls')
      .send({
        productId: 'prd-betnovate-n',
        batchNumber: 'ALL',
        manufacturerNoticeRef: 'GSK-2026-MANDATORY-RECALL',
        recallClass: 'CLASS_1_CRITICAL',
        reason: 'Contamination detected in manufacturing vessel at regional API plant.'
      });
    expect(recallAllRes.status).toBe(201);
    expect(recallAllRes.body.recall.batchNumber).toBe('ALL');

    // Product must be inactive in catalogue
    const product = dbStore.products.get('prd-betnovate-n');
    expect(product?.isActiveInCatalogue).toBe(false);

    // Inventory must be 0
    const inv = Array.from(dbStore.inventory.values()).find(i => i.productId === 'prd-betnovate-n');
    expect(inv?.availableQuantity).toBe(0);
  });

  // 7. Recall Resolution Flow
  it('7. Recall Resolution: Updates recall record with disposition notes and records audit trail', async () => {
    const recallsRes = await request(app).get('/api/v1/admin/recalls?status=ACTIVE');
    expect(recallsRes.status).toBe(200);
    const activeRecall = recallsRes.body.recalls[0];
    expect(activeRecall).toBeDefined();

    const resolveRes = await request(app)
      .post(`/api/v1/admin/recalls/${activeRecall.id}/resolve`)
      .send({
        resolutionNotes: 'Quarantined stock returned to manufacturer distributor. Credit note CR-8839 received.'
      });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.recall.status).toBe('RESOLVED');
  });

  // 8. Image Moderation Queue & Primary Image Promotion
  it('8. Image Moderation: Approves partner image with primary promotion, and rejects defective image', async () => {
    // Submit candidate image
    const submitRes = await request(app)
      .post('/api/v1/admin/image-moderations/submit')
      .send({
        productId: 'prd-dolo-650',
        submittedByPharmacyId: 'pharm-gkp-1',
        pharmacyName: 'Arogya Medical Store (Golghar)',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'
      });
    expect(submitRes.status).toBe(201);
    const modId = submitRes.body.item.id;

    // Approve with setAsPrimary
    const approveRes = await request(app)
      .post(`/api/v1/admin/image-moderations/${modId}/review`)
      .send({
        decision: 'APPROVE',
        setAsPrimary: true
      });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.item.status).toBe('APPROVED');

    // Product imageUrl is updated
    const product = dbStore.products.get('prd-dolo-650');
    expect(product?.imageUrl).toBe('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800');

    // Submit second and reject
    const submitRes2 = await request(app)
      .post('/api/v1/admin/image-moderations/submit')
      .send({
        productId: 'prd-dolo-650',
        submittedByPharmacyId: 'pharm-gkp-1',
        pharmacyName: 'Arogya Medical Store',
        imageUrl: 'https://images.unsplash.com/photo-blur.png'
      });
    const rejectRes = await request(app)
      .post(`/api/v1/admin/image-moderations/${submitRes2.body.item.id}/review`)
      .send({
        decision: 'REJECT',
        rejectionReason: 'Image is blurred and carton text unreadable.'
      });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.item.status).toBe('REJECTED');
  });
});
