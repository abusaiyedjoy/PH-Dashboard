import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root .env first, then local if exists
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_SECRET:
    process.env.JWT_SECRET ||
    'project_review_hub_dev_secret_key_with_at_least_32_characters_for_hmac',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://abusaidjoy@localhost:5432/project_review_hub?schema=public',
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    'postgresql://abusaidjoy@localhost:5432/project_review_hub_test?schema=public',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_SUBMISSIONS: parseInt(process.env.RATE_LIMIT_MAX_SUBMISSIONS || '5', 10),
  RATE_LIMIT_MAX_LOGIN: parseInt(process.env.RATE_LIMIT_MAX_LOGIN || '5', 10),
};
