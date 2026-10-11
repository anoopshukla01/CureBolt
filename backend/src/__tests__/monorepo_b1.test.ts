import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { execSync } from 'child_process';
import path from 'path';

describe('Milestone B1: Monorepo Multi-App Architecture, Versioning & App-Session Gates', () => {
  it('1. Dependency Rule Verification: No circular, peer-app or reverse-layer dependencies', () => {
    const scriptPath = path.resolve(__dirname, '../../../scripts/check_dependency_rules.js');
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });
    expect(output).toContain('All monorepo dependency rules and architectural boundaries verified successfully');
  });

  it('2. Remote App Config & Force-Update Checker: Flags outdated builds', async () => {
    // 2A. Up-to-date client (v1.0.0) -> updateRequired: false
    const validRes = await request(app)
      .get('/api/v1/config/app?appId=com.medcure.rider&version=1.0.0');
    expect(validRes.status).toBe(200);
    expect(validRes.body.appId).toBe('com.medcure.rider');
    expect(validRes.body.updateRequired).toBe(false);

    // 2B. Outdated client (v0.8.5) -> updateRequired: true with store link
    const outdatedRes = await request(app)
      .get('/api/v1/config/app?appId=com.medcure.rider&version=0.8.5');
    expect(outdatedRes.status).toBe(200);
    expect(outdatedRes.body.updateRequired).toBe(true);
    expect(outdatedRes.body.forceUpdateTitle).toContain('Update Required');
    expect(outdatedRes.body.storeUrl).toContain('play.google.com');
  });

  it('3. App Session Role Gate: Rejects accounts attempting to access wrong app surface', async () => {
    // Customer account: usr-cust-1
    // 3A. Customer attempting to access Rider App -> 403 Forbidden
    const custOnRiderRes = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-cust-1')
      .send({
        appId: 'com.medcure.rider',
        appVersion: '1.0.0',
        platform: 'android'
      });
    expect(custOnRiderRes.status).toBe(403);
    expect(custOnRiderRes.body.error).toBe("This account can't use this app");

    // 3B. Customer attempting to access Shopkeeper App -> 403 Forbidden
    const custOnShopRes = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-cust-1')
      .send({
        appId: 'com.medcure.shop',
        appVersion: '1.0.0',
        platform: 'android'
      });
    expect(custOnShopRes.status).toBe(403);
    expect(custOnShopRes.body.error).toBe("This account can't use this app");

    // 3C. Customer accessing Customer App -> 200 OK
    const custOnCustRes = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-cust-1')
      .send({
        appId: 'com.medcure.customer',
        appVersion: '1.0.0',
        platform: 'android'
      });
    expect(custOnCustRes.status).toBe(200);
    expect(custOnCustRes.body.sessionValid).toBe(true);
    expect(custOnCustRes.body.user.role).toBe('customer');

    // 3D. Rider accessing Rider App -> 200 OK
    const riderOnRiderRes = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-rider-1')
      .send({
        appId: 'com.medcure.rider',
        appVersion: '1.0.0',
        platform: 'android'
      });
    expect(riderOnRiderRes.status).toBe(200);
    expect(riderOnRiderRes.body.sessionValid).toBe(true);

    // 3E. Pharmacy Owner accessing Shop App -> 200 OK
    const ownerOnShopRes = await request(app)
      .post('/api/v1/auth/app-session')
      .set('x-user-id', 'usr-owner-1')
      .send({
        appId: 'com.medcure.shop',
        appVersion: '1.0.0',
        platform: 'android'
      });
    expect(ownerOnShopRes.status).toBe(200);
    expect(ownerOnShopRes.body.sessionValid).toBe(true);
  });
});
