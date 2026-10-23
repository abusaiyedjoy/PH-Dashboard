import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from root if available
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@projecthub.local').toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.SEED_ADMIN_NAME || 'Platform Administrator';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Seed or update initial privileged ADMIN user
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: Role.ADMIN,
      passwordHash,
    },
  });

  console.log(`✅ Seeded ADMIN user: ${adminUser.email} (Role: ${adminUser.role})`);

  // 2. Also seed a dedicated MENTOR user for easy assessment testing
  const mentorEmail = (process.env.SEED_MENTOR_EMAIL || 'mentor@projecthub.local').toLowerCase().trim();
  const mentorPassword = process.env.SEED_MENTOR_PASSWORD || 'MentorPassword123!';
  const mentorName = 'Lead Mentor Jane';
  const mentorPasswordHash = await bcrypt.hash(mentorPassword, 10);

  const mentorUser = await prisma.user.upsert({
    where: { email: mentorEmail },
    update: {
      name: mentorName,
      role: Role.MENTOR,
      passwordHash: mentorPasswordHash,
    },
    create: {
      email: mentorEmail,
      name: mentorName,
      role: Role.MENTOR,
      passwordHash: mentorPasswordHash,
    },
  });

  console.log(`✅ Seeded MENTOR user: ${mentorUser.email} (Role: ${mentorUser.role})`);

  // 3. Seed a demo STUDENT user for demonstration and testing convenience
  const studentEmail = (process.env.SEED_STUDENT_EMAIL || 'student@projecthub.local').toLowerCase().trim();
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'StudentPassword123!';
  const studentName = 'Alex Mercer (Student)';
  const studentPasswordHash = await bcrypt.hash(studentPassword, 10);

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: studentName,
      role: Role.STUDENT,
      passwordHash: studentPasswordHash,
    },
    create: {
      email: studentEmail,
      name: studentName,
      role: Role.STUDENT,
      passwordHash: studentPasswordHash,
    },
  });

  console.log(`✅ Seeded STUDENT user: ${studentUser.email} (Role: ${studentUser.role})`);

  // 4. Optionally seed a sample project if the student doesn't have any yet
  const existingProjects = await prisma.project.count({
    where: { studentId: studentUser.id },
  });

  if (existingProjects === 0) {
    await prisma.project.create({
      data: {
        name: 'Distributed Task Scheduler',
        repoUrl: 'https://github.com/alexmercer/task-scheduler',
        liveUrl: 'https://task-scheduler-demo.vercel.app',
        description: 'A resilient distributed task scheduling engine built with Node.js and Redis, supporting delayed queues and worker heartbeat monitoring.',
        status: 'PENDING',
        studentId: studentUser.id,
      },
    });

    await prisma.project.create({
      data: {
        name: 'Interactive Code Playground',
        repoUrl: 'https://github.com/alexmercer/code-canvas',
        liveUrl: 'https://code-canvas-demo.vercel.app',
        description: 'In-browser interactive coding sandbox with real-time compilation and automated unit testing runner.',
        status: 'APPROVED',
        studentId: studentUser.id,
        reviewedById: mentorUser.id,
        reviewComment: 'Outstanding execution and clean modular architecture. Well documented README and clean error boundaries.',
        reviewedAt: new Date(),
      },
    });

    console.log('✅ Seeded 2 sample projects for student testing');
  }

  console.log('✨ Database seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
