import { beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force test environment and point to test database
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

import { prisma } from '@project-review-hub/database';

export async function clearDatabase() {
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});
