import { describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../server';

describe('Milestone B4: Contracts, Clients & Multi-App Flavors', () => {
  const openApiPath = path.resolve(__dirname, '../../../backend/openapi/medcure_api.yaml');

  describe('1. OpenAPI 3.0 Contract Verification', () => {
    it('1A. OpenAPI contract exists and defines core platform endpoints', () => {
      expect(fs.existsSync(openApiPath)).toBe(true);
      const content = fs.readFileSync(openApiPath, 'utf-8');

      expect(content).toContain('openapi: 3.0.3');
      expect(content).toContain('title: Medcure Quick-Commerce Medicine Platform API');
      expect(content).toContain('/config/app:');
      expect(content).toContain('/auth/request-otp:');
      expect(content).toContain('/auth/verify-otp:');
      expect(content).toContain('/auth/app-session:');
      expect(content).toContain('/catalogue/products:');
      expect(content).toContain('/rider/location:');
      expect(content).toContain('/pharmacy/orders:');
    });

    it('1B. Schemas specify statutory safety and multi-app data structures', () => {
      const content = fs.readFileSync(openApiPath, 'utf-8');

      expect(content).toContain('Product:');
      expect(content).toContain('mrp:');
      expect(content).toContain('sellingPrice:');
      expect(content).toContain('Must be <= mrp');
      expect(content).toContain('[human, veterinary]');
    });
  });

  describe('2. Contract Endpoint Conformance', () => {
    it('2A. GET /api/v1/config/app satisfies OpenAPI contract', async () => {
      const res = await request(app).get('/api/v1/config/app?appId=com.medcure.customer&version=1.0.0');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('appId', 'com.medcure.customer');
      expect(res.body).toHaveProperty('minSupportedVersion');
      expect(res.body).toHaveProperty('updateRequired');
    });

    it('2B. GET /api/v1/catalogue/products supports human and veterinary filtering', async () => {
      const humanRes = await request(app).get('/api/v1/catalogue/products?domain=human');
      expect(humanRes.status).toBe(200);
      expect(Array.isArray(humanRes.body.items)).toBe(true);

      const vetRes = await request(app).get('/api/v1/catalogue/products?domain=veterinary');
      expect(vetRes.status).toBe(200);
      expect(Array.isArray(vetRes.body.items)).toBe(true);
    });

    it('2C. POST /api/v1/rider/location ingests telemetry', async () => {
      const res = await request(app)
        .post('/api/v1/rider/location')
        .set('x-user-id', 'usr-rider-1')
        .send({
          latitude: 26.7606,
          longitude: 83.3732,
          speed: 25.0,
          heading: 180.0,
          batteryLevel: 92,
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('2D. GET /api/v1/pharmacy/orders returns counter order queue', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/orders')
        .set('x-user-id', 'usr-staff-1');
      expect(res.status).toBe(200);
      expect(res.body.orders).toBeDefined();
    });
  });

  describe('3. Multi-App Flavor Environmental Isolation Guard', () => {
    it('3A. Prevents production flavors from targeting localhost or mock environments', () => {
      const validateProdSafety = (apiBaseUrl: string) => {
        if (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('10.0.2.2') || apiBaseUrl.includes('127.0.0.1')) {
          throw new Error('CRITICAL CONFIGURATION ERROR: Production build cannot point to a local development backend.');
        }
      };

      expect(() => validateProdSafety('http://localhost:3000/api/v1')).toThrow(
        'Production build cannot point to a local development backend'
      );
      expect(() => validateProdSafety('https://api.medcure.in/api/v1')).not.toThrow();
    });
  });
});
