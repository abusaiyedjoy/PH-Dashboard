import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy if behind reverse proxy (e.g., Nginx, Fly.io, Render)
  if (ENV.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // 2. Security Headers via Helmet
  app.use(helmet());

  // 3. CORS Configuration with explicit allowed origin and credentials
  const allowedOrigins = [
    ENV.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Supertest)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked request from origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 4. Request Logging (skip in test environment)
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // 5. Body Parsing with strict payload limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // 6. Mount Primary API Routes
  app.use('/api', apiRoutes);

  // 7. Undefined Route Handler
  app.use(notFoundHandler);

  // 8. Global Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
