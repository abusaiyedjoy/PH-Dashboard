import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma, Role } from '@project-review-hub/database';
import { clearDatabase } from './setup';

const app = createApp();

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully register a student and assign the STUDENT role', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe(Role.STUDENT);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.token).toBeDefined();

      // Verify in database that password was hashed
      const dbUser = await prisma.user.findUnique({
        where: { email: 'jane@example.com' },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe('Password123!');
      expect(dbUser?.passwordHash.startsWith('$2')).toBe(true);
    });

    it('must NEVER allow public signup to assign an elevated role (e.g., ADMIN or MENTOR)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Hacker Joe',
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'ADMIN', // Attacker attempting privilege escalation
        });

      // Zod schema strict rejection or strips it; let's verify either 400 rejection or role set strictly to STUDENT
      if (res.status === 201) {
        expect(res.body.data.user.role).toBe(Role.STUDENT);
      } else {
        expect(res.status).toBe(400);
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: 'hacker@example.com' },
      });
      if (dbUser) {
        expect(dbUser.role).toBe(Role.STUDENT);
      }
    });

    it('should reject duplicate email with 409 Conflict', async () => {
      // First signup
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'User One',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      // Duplicate signup
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'User Two',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject invalid input (short password, invalid email)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'A',
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Pre-seed a user
      await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Registered User',
          email: 'login-test@example.com',
          password: 'Password123!',
        });
    });

    it('should authenticate valid credentials and return JWT token and cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('login-test@example.com');

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('auth_token=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should reject invalid password with 401 without leaking internal details', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    it('should reject non-existent email with 401 with identical generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return the current user profile when authenticated with Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'Password123!',
        });

      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('profile@example.com');
      expect(res.body.data.role).toBe(Role.STUDENT);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid or forged token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.forged.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
