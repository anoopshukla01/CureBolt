import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';

import { secureHeaders, corsOriginVerifier, generalApiLimiter } from './middleware/security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// S1 Security Baseline: Strict Security Headers, Origin-Verified CORS, & Baseline Rate Limiter
app.use(secureHeaders);
app.use(cors({ origin: corsOriginVerifier, credentials: true }));
app.use(generalApiLimiter.getMiddleware());
app.use(express.json());

// Root Welcome & Discovery
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Medcure Quick-Commerce Medicine Delivery API',
    city: 'Gorakhpur, Uttar Pradesh',
    status: 'online',
    version: '2.0.0',
    endpoints: {
      products: 'http://localhost:4000/api/v1/products',
      catalogue: 'http://localhost:4000/api/v1/catalogue/products',
      serviceability: 'http://localhost:4000/api/v1/serviceability/check?latitude=26.7606&longitude=83.3732',
      health: 'http://localhost:4000/health'
    }
  });
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Medcure Quick-Commerce Medicine Delivery API',
    city: 'Gorakhpur, Uttar Pradesh',
    timestamp: new Date().toISOString()
  });
});

// Mount Versioned and Friendly API Routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Centralized RFC 7807 Error Handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[MEDCURE API ERROR]', err);
  res.status(500).json({
    type: 'https://medcure.in/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: err.message || 'An unexpected error occurred.'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Medcure API Gateway live on http://localhost:${PORT}`);
    console.log(`📍 Serving Gorakhpur Pilot Pilot Service Zones`);
  });
}

export default app;
