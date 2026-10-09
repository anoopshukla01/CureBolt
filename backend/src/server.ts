import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Medcure Quick-Commerce Medicine Delivery API',
    city: 'Gorakhpur, Uttar Pradesh',
    timestamp: new Date().toISOString()
  });
});

// Mount Versioned API
app.use('/api/v1', apiRouter);

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
