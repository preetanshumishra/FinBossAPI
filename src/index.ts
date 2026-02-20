import dotenv from 'dotenv';

// Load environment variables first, before any other imports
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { sanitize } from './utils/sanitize';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import budgetRoutes from './routes/budgets';
import analyticsRoutes from './routes/analytics';
import categoryRoutes from './routes/categories';
import { seedCategories } from './utils/seedCategories';
import { getErrorMessage } from './utils/errorResponse';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy (Railway, Heroku, etc.) for correct IP in rate limiting
app.set('trust proxy', 1);

const getCorsOrigin = (): string | string[] | boolean => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    return process.env.NODE_ENV === 'production' ? false : '*';
  }
  if (corsOrigin.includes(',')) {
    return corsOrigin.split(',').map((o) => o.trim());
  }
  return corsOrigin;
};

const origin = getCorsOrigin();

const corsOptions = {
  origin,
  credentials: origin !== '*' && origin !== false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Sanitize req.body to strip Mongo operator keys ($ and .).
// Custom implementation because express-mongo-sanitize v2 is incompatible with Express 5.
// req.query is safe in Express 5: values are always flat strings (no nested object injection).
app.use((req: Request, _res: Response, next: (err?: unknown) => void) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  next();
});

// Global rate limiting: 100 requests per 15 minutes per IP (disabled in test)
if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later',
    },
  });
  app.use('/api/', globalLimiter);
}

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/swagger.json',
  },
}));

// Swagger JSON endpoint
app.get('/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API version endpoint
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    version: 'v1',
    message: 'FinBoss API v1',
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/categories', categoryRoutes);

// 404 handler (must use middleware function, not route)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: _req.path,
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: (arg: Error) => void
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(err, 'Internal server error'),
    });
  }
);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Seed default categories
    await seedCategories();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📖 API: http://localhost:${PORT}/api/v1`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
