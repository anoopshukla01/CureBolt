import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Milestone B2: Core Packages (Models, UI Tokens, Localization & Config)', () => {
  it('1. Statutory Safety Rule: Selling price must never exceed MRP', async () => {
    // Attempting to create or update a product with sellingPrice > mrp is rejected
    const invalidProductRes = await request(app)
      .post('/api/v1/pharmacy/products/create')
      .send({
        name: 'Invalid Safety Pricing Tablet',
        brand: 'Test Pharma',
        categoryDomain: 'human',
        manufacturer: 'Acme Health Ltd',
        availableQuantity: 50,
        packSize: '10 Tablets',
        mrp: 100,
        sellingPrice: 150, // Violation: 150 > 100
      });
    expect(invalidProductRes.status).toBe(400);
    expect(invalidProductRes.body.error).toContain('Selling price');
    expect(invalidProductRes.body.error).toContain('cannot exceed MRP');
  });

  it('2. App Config & Force Update: Verifies minimum supported versions per app surface', async () => {
    // 2A. Customer App
    const custRes = await request(app).get('/api/v1/config/app?appId=com.medcure.customer&version=1.0.0');
    expect(custRes.status).toBe(200);
    expect(custRes.body.appId).toBe('com.medcure.customer');
    expect(custRes.body.updateRequired).toBe(false);

    // 2B. Rider Fleet App - Outdated build
    const riderOutdatedRes = await request(app).get('/api/v1/config/app?appId=com.medcure.rider&version=0.9.1');
    expect(riderOutdatedRes.status).toBe(200);
    expect(riderOutdatedRes.body.updateRequired).toBe(true);
    expect(riderOutdatedRes.body.forceUpdateTitle).toContain('Fleet App Update Required');

    // 2C. Shopkeeper App - Outdated build
    const shopOutdatedRes = await request(app).get('/api/v1/config/app?appId=com.medcure.shop&version=0.8.0');
    expect(shopOutdatedRes.status).toBe(200);
    expect(shopOutdatedRes.body.updateRequired).toBe(true);
    expect(shopOutdatedRes.body.forceUpdateTitle).toContain('Counter Terminal Update Required');
  });

  it('3. Multi-App Scope Authorization: Ensures role isolation across all three app IDs', async () => {
    // 3A. Rider cannot access Shopkeeper Counter App
    const riderOnShop = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-rider-1')
      .send({ appId: 'com.medcure.shop', appVersion: '1.0.0' });
    expect(riderOnShop.status).toBe(403);
    expect(riderOnShop.body.error).toBe("This account can't use this app");

    // 3B. Pharmacy Staff cannot access Customer App
    const staffOnCust = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-staff-1')
      .send({ appId: 'com.medcure.customer', appVersion: '1.0.0' });
    expect(staffOnCust.status).toBe(403);
    expect(staffOnCust.body.error).toBe("This account can't use this app");

    // 3C. Customer cannot access Rider App
    const custOnRider = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-cust-1')
      .send({ appId: 'com.medcure.rider', appVersion: '1.0.0' });
    expect(custOnRider.status).toBe(403);
    expect(custOnRider.body.error).toBe("This account can't use this app");
  });
});
