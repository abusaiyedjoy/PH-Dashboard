import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { clearDatabase } from './setup';

const app = createApp();

describe('Project Submissions & Student Access', () => {
  let studentToken: string;
  let otherStudentToken: string;

  beforeEach(async () => {
    await clearDatabase();

    // Create primary student
    const studentRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Student One',
        email: 'student1@example.com',
        password: 'Password123!',
      });
    studentToken = studentRes.body.data.token;

    // Create secondary student
    const otherRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Student Two',
        email: 'student2@example.com',
        password: 'Password123!',
      });
    otherStudentToken = otherRes.body.data.token;
  });

  describe('POST /api/projects', () => {
    it('should allow student to submit a valid project with PENDING status', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Realtime Chat Engine',
          repoUrl: 'https://github.com/student1/realtime-chat',
          liveUrl: 'https://realtime-chat.demo.app',
          description: 'A scalable WebSocket-driven chat platform supporting rooms, typing indicators, and presence detection.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Realtime Chat Engine');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.student.email).toBe('student1@example.com');
      expect(res.body.data.reviewedById).toBeNull();
      expect(res.body.data.reviewComment).toBeNull();
    });

    it('must ignore or reject client-supplied privileged fields (status, studentId, reviewedById)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Privilege Escalation Test',
          repoUrl: 'https://github.com/student1/escalation-test',
          liveUrl: 'https://escalation.demo.app',
          description: 'Testing whether a client can override status to APPROVED or spoof reviewer info.',
          status: 'APPROVED', // Client attempting to approve own project
          studentId: 'other-id',
          reviewedById: 'fake-mentor-id',
        });

      // Zod schema is .strict() so it will reject extra fields with 400
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid URLs or missing fields', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Bad URL Project',
          repoUrl: 'not-a-valid-url',
          liveUrl: 'invalid-live-url',
          description: 'Short', // Less than 20 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject duplicate repository URL submission by the same student', async () => {
      // 1. First submission
      const firstRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Original Submission',
          repoUrl: 'https://github.com/student1/my-portfolio.git',
          liveUrl: 'https://portfolio.demo.app',
          description: 'Personal developer portfolio built with Next.js and Tailwind CSS with responsive layout.',
        });
      expect(firstRes.status).toBe(201);

      // 2. Duplicate submission with trailing slash / case variation
      const duplicateRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Duplicate Submission Attempt',
          repoUrl: 'https://github.com/Student1/my-portfolio/',
          liveUrl: 'https://portfolio.demo.app',
          description: 'Attempting to resubmit the exact same repository with varied casing and trailing slashes.',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toContain('Duplicate submissions');
    });

    it('should allow a different student to submit the same repository URL', async () => {
      // Student 1 submits
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Group Project Student 1',
          repoUrl: 'https://github.com/team/group-project',
          liveUrl: 'https://group.demo.app',
          description: 'Collaborative group project submission by student 1 with modular architecture.',
        });

      // Student 2 submits the same repo
      const res2 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          name: 'Group Project Student 2',
          repoUrl: 'https://github.com/team/group-project',
          liveUrl: 'https://group.demo.app',
          description: 'Collaborative group project submission by student 2 with modular architecture.',
        });

      expect(res2.status).toBe(201);
      expect(res2.body.success).toBe(true);
    });
  });

  describe('GET /api/projects/my and /api/projects/my/stats', () => {
    it('should return only the authenticated student projects with correct status counts', async () => {
      // Student 1 submits 2 projects
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Project Alpha',
          repoUrl: 'https://github.com/student1/alpha',
          liveUrl: 'https://alpha.demo.app',
          description: 'Description for project alpha with sufficient character length for validation.',
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Project Beta',
          repoUrl: 'https://github.com/student1/beta',
          liveUrl: 'https://beta.demo.app',
          description: 'Description for project beta with sufficient character length for validation.',
        });

      // Student 2 submits 1 project
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          name: 'Project Gamma',
          repoUrl: 'https://github.com/student2/gamma',
          liveUrl: 'https://gamma.demo.app',
          description: 'Description for project gamma with sufficient character length for validation.',
        });

      // Student 1 checks my projects
      const myProjects = await request(app)
        .get('/api/projects/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(myProjects.status).toBe(200);
      expect(myProjects.body.data.items.length).toBe(2);
      expect(myProjects.body.data.pagination.totalItems).toBe(2);

      // Student 1 checks my stats
      const myStats = await request(app)
        .get('/api/projects/my/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(myStats.status).toBe(200);
      expect(myStats.body.data.total).toBe(2);
      expect(myStats.body.data.pending).toBe(2);
      expect(myStats.body.data.approved).toBe(0);
      expect(myStats.body.data.rejected).toBe(0);
    });
  });
});
