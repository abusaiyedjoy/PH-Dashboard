import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { clearDatabase } from './setup';

const app = createApp();

describe('Submission Rate Limiting Verification', () => {
  let studentToken: string;

  beforeEach(async () => {
    await clearDatabase();

    const studentRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Rate Limit Student',
        email: 'ratelimit@example.com',
        password: 'Password123!',
      });
    studentToken = studentRes.body.data.token;
  });

  it('should return HTTP 429 after exceeding the submission rate limit threshold', async () => {
    // Submit 5 valid distinct projects (limit is 5 requests per window)
    for (let i = 1; i <= 5; i++) {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: `Rate Limit Project ${i}`,
          repoUrl: `https://github.com/ratelimit/project-${i}`,
          liveUrl: `https://project-${i}.demo.app`,
          description: `Valid description for rate limit test project ${i} meeting required length.`,
        });

      expect(res.status).toBe(201);
    }

    // The 6th submission should trigger rate limit HTTP 429
    const sixthRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Rate Limit Project 6',
        repoUrl: 'https://github.com/ratelimit/project-6',
        liveUrl: 'https://project-6.demo.app',
        description: 'Valid description for the sixth project that exceeds the rate limit threshold.',
      });

    expect(sixthRes.status).toBe(429);
    expect(sixthRes.body.success).toBe(false);
    expect(sixthRes.body.message).toContain('Too many project submissions');
  });
});
