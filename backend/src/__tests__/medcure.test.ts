import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Medcure Platform Core Engine & Fulfilment Workflow', () => {

  it('1. Serviceability: Verifies Gorakhpur pilot zone', async () => {
    // Inside Gorakhpur (Golghar coords)
    const resInside = await request(app)
      .get('/api/v1/serviceability/check?lat=26.7606&lng=83.3732');
    expect(resInside.status).toBe(200);
    expect(resInside.body.is_serviceable).toBe(true);
    expect(resInside.body.city).toBe('Gorakhpur');

    // Outside Gorakhpur (e.g., Delhi coords)
    const resOutside = await request(app)
      .get('/api/v1/serviceability/check?lat=28.6139&lng=77.2090');
    expect(resOutside.status).toBe(200);
    expect(resOutside.body.is_serviceable).toBe(false);
  });

  it('2. Catalogue: Returns separated Human & Veterinary products with required metadata', async () => {
    // Human products
    const resHuman = await request(app)
      .get('/api/v1/catalogue/products?domain=human');
    expect(resHuman.status).toBe(200);
    expect(resHuman.body.items.length).toBeGreaterThan(0);
    resHuman.body.items.forEach((item: any) => {
      expect(item.categoryDomain).toBe('human');
    });

    // Veterinary products
    const resVet = await request(app)
      .get('/api/v1/catalogue/products?domain=veterinary');
    expect(resVet.status).toBe(200);
    expect(resVet.body.items.length).toBeGreaterThan(0);
    const intacef = resVet.body.items.find((p: any) => p.name.includes('Intacef'));
    expect(intacef).toBeDefined();
    expect(intacef.requiresPrescription).toBe(true);
    expect(intacef.speciesRestrictions[0].withdrawalPeriodDays).toBe(7);
  });

  it('3. Compliance Guardrail: Order with prescription-required medicine fails without attached Rx', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        items: [{ productId: 'prd-glycomet-500', quantity: 1 }] // Glycomet is Schedule H
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('prescription-required products');
  });

  it('4. Full End-to-End Rx Fulfilment: Upload Rx -> Create Order -> Pharmacist Approval -> Packing -> Delivery OTP', async () => {
    // Step A: Upload Prescription Intent
    const uploadRes = await request(app)
      .post('/api/v1/prescriptions/upload-intent')
      .send({
        userId: 'usr-cust-1',
        fileName: 'dr_sharma_rx.jpg',
        doctorName: 'Dr. R.K. Sharma'
      });
    expect(uploadRes.status).toBe(200);
    const rxId = uploadRes.body.prescription_id;
    expect(rxId).toBeDefined();

    // Step B: Create Order with attached Prescription
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        items: [{ productId: 'prd-glycomet-500', quantity: 2 }],
        prescriptionId: rxId
      });
    expect(orderRes.status).toBe(201);
    const order = orderRes.body.order;
    expect(order.state).toBe('PHARMACY_REVIEW');
    const orderId = order.id;

    // Step C: Registered Pharmacist reviews & approves with UP Registration Council #
    const reviewRes = await request(app)
      .post(`/api/v1/pharmacy/orders/${orderId}/review-prescription`)
      .send({
        pharmacistId: 'usr-pharma-1',
        pharmacistRegNumber: 'UP-PCR-78421',
        decision: 'approved',
        notes: 'Verified dosage 500mg SR twice daily.'
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.order.state).toBe('PAYMENT_PENDING');

    // Step D: Simulate payment confirmation via webhook
    const payRes = await request(app)
      .post('/api/v1/payments/create-order')
      .send({ orderId });
    expect(payRes.status).toBe(200);

    const webhookRes = await request(app)
      .post('/api/v1/payments/webhook')
      .send({
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_mock_123',
              order_id: payRes.body.razorpay_order_id
            }
          }
        }
      });
    expect(webhookRes.status).toBe(200);

    // Verify order state transitioned to PAYMENT_CONFIRMED
    const getOrderRes = await request(app).get(`/api/v1/orders/${orderId}`);
    expect(getOrderRes.body.order.state).toBe('PAYMENT_CONFIRMED');

    // Step E: Pharmacy packs with specific physical batch number
    const packRes = await request(app)
      .post(`/api/v1/pharmacy/orders/${orderId}/pack`)
      .send({
        staffId: 'usr-staff-1',
        batchAllocations: [{
          productId: 'prd-glycomet-500',
          batchNumber: 'GLY-8490',
          expiryDate: '2026-11-30'
        }]
      });
    expect(packRes.status).toBe(200);
    expect(packRes.body.order.state).toBe('PACKED');

    // Step F: Dispatcher assigns rider
    const assignRes = await request(app)
      .post('/api/v1/dispatch/assign-rider')
      .send({
        orderId,
        riderId: 'usr-rider-1'
      });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.order.state).toBe('RIDER_ASSIGNED');

    // Step G: Rider collects package
    const pickupRes = await request(app)
      .post(`/api/v1/rider/orders/${orderId}/pickup`);
    expect(pickupRes.status).toBe(200);
    expect(pickupRes.body.order.state).toBe('OUT_FOR_DELIVERY');

    // Step H: Final Delivery requires correct OTP Handshake
    const wrongOtpRes = await request(app)
      .post(`/api/v1/rider/orders/${orderId}/complete-delivery`)
      .send({ deliveryOtp: '0000' });
    expect(wrongOtpRes.status).toBe(400);

    const validOtpRes = await request(app)
      .post(`/api/v1/rider/orders/${orderId}/complete-delivery`)
      .send({ deliveryOtp: getOrderRes.body.order.deliveryOtp });
    expect(validOtpRes.status).toBe(200);
    expect(validOtpRes.body.order.state).toBe('DELIVERED');
  });

  it('5. AI Assistant Safeguards: Blocks medical diagnosis and dosage queries with standard guardrail', async () => {
    // Medical diagnosis attempt
    const diagRes = await request(app)
      .post('/api/v1/ai/chat')
      .send({ prompt: 'My cow has high fever, what dosage of paracetamol should I give?' });
    
    expect(diagRes.status).toBe(200);
    expect(diagRes.body.escalateToHumanSupport).toBe(true);
    expect(diagRes.body.message).toContain('cannot diagnose medical conditions, calculate drug dosages');

    // Grounded catalogue query
    const catRes = await request(app)
      .post('/api/v1/ai/chat')
      .send({ prompt: 'Do you have HimCal liquid calcium in Gorakhpur?' });

    expect(catRes.status).toBe(200);
    expect(catRes.body.escalateToHumanSupport).toBe(false);
    expect(catRes.body.message).toContain('HimCal Liquid Calcium');
    expect(catRes.body.suggestedProductIds.length).toBeGreaterThan(0);
  });

  it('6. Assistive Prescription OCR: Extracts text and fuzzy matches candidate medicines', async () => {
    // Step A: Upload Prescription
    const uploadRes = await request(app)
      .post('/api/v1/prescriptions/upload-intent')
      .send({
        userId: 'usr-cust-1',
        fileName: 'dr_rao_prescription.pdf'
      });
    const rxId = uploadRes.body.prescription_id;

    // Step B: Run OCR analysis
    const ocrRes = await request(app)
      .post(`/api/v1/prescriptions/${rxId}/ocr`);

    expect(ocrRes.status).toBe(200);
    expect(ocrRes.body.status).toBe('ocr_processed');
    expect(ocrRes.body.extracted_text).toContain('Dr. K. N. Rao');
    expect(ocrRes.body.candidate_matches.length).toBeGreaterThan(0);
    
    // Check Dolo and Glycomet match confidence
    const doloMatch = ocrRes.body.candidate_matches.find((m: any) => m.productId === 'prd-dolo-650');
    expect(doloMatch).toBeDefined();
    expect(doloMatch.confidence).toBeGreaterThan(0.85);
  });

  it('7. COD Order Flow: Creates OTC order, bypasses gateway, tracks doorstep collection', async () => {
    // Create OTC COD Order (Dolo 650 is OTC)
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'human',
        paymentMode: 'COD',
        items: [{ productId: 'prd-dolo-650', quantity: 2 }]
      });

    expect(orderRes.status).toBe(201);
    const order = orderRes.body.order;
    expect(order.paymentMode).toBe('COD');
    // COD OTC orders move directly to ACCEPTED without requiring online payment webhook
    expect(order.state).toBe('ACCEPTED');

    // Pharmacy packs
    const packRes = await request(app)
      .post(`/api/v1/pharmacy/orders/${order.id}/pack`)
      .send({
        staffId: 'usr-staff-1',
        batchAllocations: [{ productId: 'prd-dolo-650', batchNumber: 'DL-24A91', expiryDate: '2027-02-28' }]
      });
    expect(packRes.body.order.state).toBe('PACKED');

    // Assign & Out for delivery
    const assignRes = await request(app).post('/api/v1/dispatch/assign-rider').send({ orderId: order.id, riderId: 'rider-1' });
    expect(assignRes.status).toBe(200);
    await request(app).post(`/api/v1/rider/orders/${order.id}/pickup`);

    // Complete delivery with OTP and COD collection
    const completeRes = await request(app)
      .post(`/api/v1/rider/orders/${order.id}/complete-delivery`)
      .send({ deliveryOtp: order.deliveryOtp });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.order.state).toBe('DELIVERED');
    expect(completeRes.body.cod_collection).toBeDefined();
    expect(completeRes.body.cod_collection.amountCollected).toBe(order.payableAmount);
    expect(completeRes.body.cod_collection.receiptNumber).toContain('COD-GKP-');
  });

  it('8. Live Rider GPS Tracking & Dynamic ETA: Calculates distance, ETA in minutes, and staleness flag', async () => {
    // Create and dispatch an order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({
        userId: 'usr-cust-1',
        pharmacyId: 'pharm-gkp-1',
        deliveryAddressId: 'addr-cust-1',
        categoryDomain: 'veterinary',
        paymentMode: 'COD',
        items: [{ productId: 'prd-himcal-1l', quantity: 1 }]
      });
    const orderId = orderRes.body.order.id;

    // Pack order
    await request(app)
      .post(`/api/v1/pharmacy/orders/${orderId}/pack`)
      .send({
        staffId: 'usr-staff-1',
        batchAllocations: [{ productId: 'prd-himcal-1l', batchNumber: 'HC-202409', expiryDate: '2026-08-31' }]
      });

    // Assign rider
    await request(app).post('/api/v1/dispatch/assign-rider').send({ orderId, riderId: 'rider-1' });

    // Post GPS location update from rider's device
    const locRes = await request(app)
      .post('/api/v1/rider/location-update')
      .send({
        riderId: 'rider-1',
        orderId,
        latitude: 26.7580,
        longitude: 83.3710,
        speedKmh: 24,
        heading: 60
      });
    expect(locRes.status).toBe(200);
    expect(locRes.body.snapshot.latitude).toBe(26.7580);

    // Fetch tracking view
    const trackRes = await request(app)
      .get(`/api/v1/orders/${orderId}/tracking`);

    expect(trackRes.status).toBe(200);
    expect(trackRes.body.distance_km).toBeGreaterThan(0);
    expect(trackRes.body.eta_minutes).toBeGreaterThan(0);
    expect(trackRes.body.eta_display).toContain('Arriving in about');
    expect(trackRes.body.is_stale).toBe(false);
    expect(trackRes.body.rider.name).toBe('Vikas Yadav');
  });

  it('9. Admin COD Reconciliation: Inspects outstanding cash-in-hand and records bank settlement', async () => {
    // Fetch reconciliation summary
    const reconRes = await request(app)
      .get('/api/v1/admin/cod/reconciliation');

    expect(reconRes.status).toBe(200);
    expect(reconRes.body.riders.length).toBeGreaterThan(0);
    const rider = reconRes.body.riders.find((r: any) => r.id === 'rider-1');
    expect(rider).toBeDefined();

    const cashToSettle = rider.currentCashInHand;
    if (cashToSettle > 0) {
      // Settle cash
      const settleRes = await request(app)
        .post('/api/v1/admin/cod/settle')
        .send({
          riderId: 'rider-1',
          amount: cashToSettle,
          depositReference: 'SBI-GKP-CASH-DEP-98124',
          verifiedBy: 'usr-admin-1'
        });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.remaining_cash_in_hand).toBe(0);
    }
  });

  it('10. Statutory Safety & MRP Rule: Selling price must never exceed MRP', async () => {
    const res = await request(app).get('/api/v1/catalogue/products');
    expect(res.status).toBe(200);
    res.body.items.forEach((p: any) => {
      expect(p.selling_price).toBeLessThanOrEqual(p.mrp);
    });
  });

});
