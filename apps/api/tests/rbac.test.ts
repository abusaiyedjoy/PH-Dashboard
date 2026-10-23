import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { prisma, Role } from '@project-review-hub/database';
import { clearDatabase } from './setup';

const app = createApp();

describe('Role-Based Access Control (RBAC)', () => {
  let studentToken: string;
  let otherStudentToken: string;
  let mentorToken: string;
  let adminToken: string;
  let student1ProjectId: string;

  beforeEach(async () => {
    await clearDatabase();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Seed Student 1
    const s1 = await prisma.user.create({
      data: {
        name: 'Student One',
        email: 's1@example.com',
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // 2. Seed Student 2
    await prisma.user.create({
      data: {
        name: 'Student Two',
        email: 's2@example.com',
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // 3. Seed Mentor
    await prisma.user.create({
      data: {
        name: 'Mentor Jane',
        email: 'mentor@example.com',
        passwordHash,
        role: Role.MENTOR,
      },
    });

    // 4. Seed Admin
    await prisma.user.create({
      data: {
        name: 'Admin Bob',
        email: 'admin@example.com',
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // Obtain tokens via login
    const s1Login = await request(app).post('/api/auth/login').send({
      email: 's1@example.com',
      password: 'Password123!',
    });
    studentToken = s1Login.body.data.token;

    const s2Login = await request(app).post('/api/auth/login').send({
      email: 's2@example.com',
      password: 'Password123!',
    });
    otherStudentToken = s2Login.body.data.token;

    const mentorLogin = await request(app).post('/api/auth/login').send({
      email: 'mentor@example.com',
      password: 'Password123!',
    });
    mentorToken = mentorLogin.body.data.token;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.token;

    // Student 1 submits a project
    const proj = await prisma.project.create({
      data: {
        name: 'Student 1 Project',
        repoUrl: 'https://github.com/s1/proj',
        liveUrl: 'https://s1-proj.demo.app',
        description: 'Detailed description for student 1 project with sufficient length.',
        status: 'PENDING',
        studentId: s1.id,
      },
    });
    student1ProjectId = proj.id;
  });

  describe('Student Access Restrictions', () => {
    it('should forbid student from accessing mentor-only project listing (403)', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should forbid student from accessing global mentor statistics (403)', async () => {
      const res = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid student from approving or rejecting projects (403)', async () => {
      const res = await request(app)
        .patch(`/api/projects/${student1ProjectId}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid a student from viewing another student private submission (403)', async () => {
      const res = await request(app)
        .get(`/api/projects/${student1ProjectId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('should allow a student to view their own submission (200)', async () => {
      const res = await request(app)
        .get(`/api/projects/${student1ProjectId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(student1ProjectId);
    });
  });

  describe('Mentor and Admin Authorized Access', () => {
    it('should allow Mentor to list projects and access global stats', async () => {
      const listRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items).toBeDefined();

      const statsRes = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.data.total).toBe(1);
    });

    it('should allow Admin to list projects and access global stats', async () => {
      const listRes = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items).toBeDefined();
    });

    it('should allow Mentor to inspect any student project', async () => {
      const res = await request(app)
        .get(`/api/projects/${student1ProjectId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(student1ProjectId);
    });
  });
});
