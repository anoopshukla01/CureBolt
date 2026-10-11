import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { dbStore } from '../store';

describe('Milestone 5: Checkout, Idempotency & Integer Paise Billing', () => {
  const userId = 'usr-cust-1';
  const pharmacyId = 'pharm-gkp-1';
  const addressId = 'addr-cust-1';
  const productId = 'prd-dolo-650';

  beforeEach(() => {
    // Reset inventory to clean state
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === pharmacyId && i.productId === productId
    );
    if (inv) {
      inv.availableQuantity = 100;
      inv.reservedQuantity = 0;
    }
  });

  it('1. Idempotency: Repeated order creation with same Idempotency-Key returns identical order', async () => {
    const key = `idemp-key-${Date.now()}`;
    const payload = {
      userId,
      pharmacyId,
      deliveryAddressId: addressId,
      categoryDomain: 'human',
      paymentMode: 'ONLINE',
      items: [{ productId, quantity: 2 }]
    };

    const res1 = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', key)
      .send(payload);

    expect(res1.status).toBe(201);
    const order1 = res1.body.order;
    expect(order1).toBeDefined();
    expect(order1.idempotencyKey).toBe(key);

    const initialOrderCount = dbStore.orders.size;

    // Second request with same key
    const res2 = await request(app)
      .post('/api/v1/orders')
      .set('Idempotency-Key', key)
      .send(payload);

    expect(res2.status).toBe(201);
    const order2 = res2.body.order;
    expect(order2.id).toBe(order1.id);
    expect(order2.orderCode).toBe(order1.orderCode);
    expect(dbStore.orders.size).toBe(initialOrderCount); // No duplicate order created
  });

  it('2. Money Rule: All amounts are server-computed integer paise', async () => {
    const payload = {
      userId,
      pharmacyId,
      deliveryAddressId: addressId,
      categoryDomain: 'human',
      paymentMode: 'ONLINE',
      items: [{ productId, quantity: 3 }] // Dolo 650 @ 30.50 selling price
    };

    const res = await request(app)
      .post('/api/v1/orders')
      .send(payload);

    expect(res.status).toBe(201);
    const order = res.body.order;

    // 3 * 3050 paise = 9150 paise
    expect(order.itemTotalPaise).toBe(9150);
    // Under ₹500, delivery fee is 2500 paise (₹25)
    expect(order.deliveryFeePaise).toBe(2500);
    // Handling fee is 500 paise (₹5)
    expect(order.handlingFeePaise).toBe(500);
    // Payable amount = 9150 + 2500 + 500 = 12150 paise
    expect(order.payableAmountPaise).toBe(12150);
    // Integrity check
    expect(order.payableAmountPaise).toBe(
      order.itemTotalPaise + order.deliveryFeePaise + order.handlingFeePaise
    );
    // Medicine MRP is tax inclusive: no added product tax
    expect(order.taxes).toBe(0);
  });

  it('3. Inventory Reservations: Creates active reservation rows with expiry', async () => {
    const payload = {
      userId,
      pharmacyId,
      deliveryAddressId: addressId,
      categoryDomain: 'human',
      paymentMode: 'ONLINE',
      items: [{ productId, quantity: 4 }]
    };

    const res = await request(app).post('/api/v1/orders').send(payload);
    expect(res.status).toBe(201);
    const order = res.body.order;

    // Check reservations table
    const reservation = Array.from(dbStore.reservations.values()).find(
      r => r.orderId === order.id && r.productId === productId
    );
    expect(reservation).toBeDefined();
    expect(reservation!.quantity).toBe(4);
    expect(reservation!.status).toBe('ACTIVE');
    expect(new Date(reservation!.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('4. Inventory Guard: Rejects orders exceeding available inventory', async () => {
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === pharmacyId && i.productId === productId
    );
    if (inv) inv.availableQuantity = 2;

    const payload = {
      userId,
      pharmacyId,
      deliveryAddressId: addressId,
      categoryDomain: 'human',
      paymentMode: 'ONLINE',
      items: [{ productId, quantity: 5 }] // Exceeds available stock of 2
    };

    const res = await request(app).post('/api/v1/orders').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('validation failed');
    expect(res.body.itemErrors[0].error).toContain('Insufficient stock');
  });

  it('5. Safeguards: Rejects delivery notes containing medical advice or dosage requests', async () => {
    const payload = {
      userId,
      pharmacyId,
      deliveryAddressId: addressId,
      categoryDomain: 'human',
      paymentMode: 'ONLINE',
      deliveryNote: 'Please change dosage to 500mg tablets instead',
      items: [{ productId, quantity: 1 }]
    };

    const res = await request(app).post('/api/v1/orders').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('dosage instructions');
  });

  it('6. Reservation Expiry: releaseExpiredReservations frees expired holds back to inventory', () => {
    const inv = Array.from(dbStore.inventory.values()).find(
      i => i.pharmacyId === pharmacyId && i.productId === productId
    )!;
    const initialAvailable = inv.availableQuantity;

    // Create an expired reservation
    const expiredResId = 'res-test-expired';
    dbStore.reservations.set(expiredResId, {
      id: expiredResId,
      orderId: 'ord-expired-test',
      pharmacyId,
      productId,
      quantity: 5,
      expiresAt: new Date(Date.now() - 10000).toISOString(), // 10s in the past
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 60000).toISOString()
    });
    inv.reservedQuantity += 5;

    const released = dbStore.releaseExpiredReservations();
    expect(released).toBeGreaterThanOrEqual(1);

    const updatedRes = dbStore.reservations.get(expiredResId);
    expect(updatedRes?.status).toBe('RELEASED');
    expect(inv.availableQuantity).toBe(initialAvailable + 5);
  });
});
