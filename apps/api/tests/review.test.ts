import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { prisma, Role } from '@project-review-hub/database';
import { clearDatabase } from './setup';

const app = createApp();

describe('Pagination, Filtering, Statistics & Review Actions', () => {
  let mentorToken: string;
  let mentorUserId: string;
  let pendingProjectId: string;

  beforeEach(async () => {
    await clearDatabase();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create Mentor
    const mentor = await prisma.user.create({
      data: {
        name: 'Lead Reviewer',
        email: 'mentor@test.com',
        passwordHash,
        role: Role.MENTOR,
      },
    });
    mentorUserId = mentor.id;

    const mentorLogin = await request(app).post('/api/auth/login').send({
      email: 'mentor@test.com',
      password: 'Password123!',
    });
    mentorToken = mentorLogin.body.data.token;

    // Create Student
    const student = await prisma.user.create({
      data: {
        name: 'Alex Mercer',
        email: 'alex@test.com',
        passwordHash,
        role: Role.STUDENT,
      },
    });

    // Seed 5 projects: 2 PENDING, 2 APPROVED, 1 REJECTED
    const p1 = await prisma.project.create({
      data: {
        name: 'React Dashboard',
        repoUrl: 'https://github.com/alex/react-dashboard',
        liveUrl: 'https://react-dash.demo.app',
        description: 'Detailed description for React Dashboard with valid length requirements.',
        status: 'PENDING',
        studentId: student.id,
      },
    });
    pendingProjectId = p1.id;

    await prisma.project.create({
      data: {
        name: 'Node Microservice',
        repoUrl: 'https://github.com/alex/node-microservice',
        liveUrl: 'https://node-micro.demo.app',
        description: 'Detailed description for Node Microservice with valid length requirements.',
        status: 'PENDING',
        studentId: student.id,
      },
    });

    await prisma.project.create({
      data: {
        name: 'GraphQL API Gateway',
        repoUrl: 'https://github.com/alex/graphql-gateway',
        liveUrl: 'https://graphql.demo.app',
        description: 'Detailed description for GraphQL API Gateway with valid length requirements.',
        status: 'APPROVED',
        studentId: student.id,
        reviewedById: mentor.id,
        reviewedAt: new Date(),
        reviewComment: 'Excellent architecture!',
      },
    });

    await prisma.project.create({
      data: {
        name: 'Docker Deploy Pipeline',
        repoUrl: 'https://github.com/alex/docker-pipeline',
        liveUrl: 'https://docker.demo.app',
        description: 'Detailed description for Docker Deploy Pipeline with valid length requirements.',
        status: 'APPROVED',
        studentId: student.id,
        reviewedById: mentor.id,
        reviewedAt: new Date(),
      },
    });

    await prisma.project.create({
      data: {
        name: 'Legacy PHP Migration',
        repoUrl: 'https://github.com/alex/legacy-php',
        liveUrl: 'https://php.demo.app',
        description: 'Detailed description for Legacy PHP Migration with valid length requirements.',
        status: 'REJECTED',
        studentId: student.id,
        reviewedById: mentor.id,
        reviewedAt: new Date(),
        reviewComment: 'Missing unit test coverage and insecure DB queries.',
      },
    });
  });

  describe('Server-Side Pagination & Filtering', () => {
    it('should paginate results with page and limit parameters', async () => {
      const res = await request(app)
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(2);
      expect(res.body.data.pagination.totalItems).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(3);
    });

    it('should filter projects by APPROVED status on the server', async () => {
      const res = await request(app)
        .get('/api/projects?status=APPROVED')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      expect(res.body.data.pagination.totalItems).toBe(2);
      res.body.data.items.forEach((item: { status: string }) => {
        expect(item.status).toBe('APPROVED');
      });
    });

    it('should filter projects by REJECTED status on the server', async () => {
      const res = await request(app)
        .get('/api/projects?status=REJECTED')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe('Legacy PHP Migration');
    });

    it('should filter projects by PENDING status on the server', async () => {
      const res = await request(app)
        .get('/api/projects?status=PENDING')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(2);
      res.body.data.items.forEach((item: { status: string }) => {
        expect(item.status).toBe('PENDING');
      });
    });

    it('should support server-side search by project name', async () => {
      const res = await request(app)
        .get('/api/projects?search=Docker')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].name).toBe('Docker Deploy Pipeline');
    });
  });

  describe('Server-Side Aggregated Statistics', () => {
    it('should return aggregated counts across the full PostgreSQL dataset', async () => {
      const res = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(5);
      expect(res.body.data.pending).toBe(2);
      expect(res.body.data.approved).toBe(2);
      expect(res.body.data.rejected).toBe(1);
    });
  });

  describe('Review Actions (PATCH /api/projects/:id/review)', () => {
    it('should allow mentor to approve a pending project and record reviewer metadata', async () => {
      const res = await request(app)
        .patch(`/api/projects/${pendingProjectId}/review`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          status: 'APPROVED',
          reviewComment: 'Approved! Clean code and well documented.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.reviewedById).toBe(mentorUserId);
      expect(res.body.data.reviewComment).toBe('Approved! Clean code and well documented.');
      expect(res.body.data.reviewedAt).toBeDefined();

      // Verify persistence in database
      const dbProject = await prisma.project.findUnique({
        where: { id: pendingProjectId },
      });
      expect(dbProject?.status).toBe('APPROVED');
      expect(dbProject?.reviewedById).toBe(mentorUserId);
    });

    it('should allow mentor to reject a project with feedback comment', async () => {
      const res = await request(app)
        .patch(`/api/projects/${pendingProjectId}/review`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          status: 'REJECTED',
          reviewComment: 'Please fix the broken live demo link and re-submit.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.reviewComment).toContain('broken live demo link');
    });

    it('should reject invalid review status with 400 Validation Error', async () => {
      const res = await request(app)
        .patch(`/api/projects/${pendingProjectId}/review`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          status: 'INVALID_STATUS',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
