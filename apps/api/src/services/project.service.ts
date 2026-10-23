import { prisma, ProjectStatus, Prisma } from '@project-review-hub/database';
import { CreateProjectInput, ReviewProjectInput, ProjectQueryInput } from '../validators/project.validator';
import { normalizeRepoUrl } from '../utils/urlNormalizer';
import { AppError } from '../middlewares/error.middleware';
import { AuthenticatedUser } from '../middlewares/auth.middleware';
import { PaginationMeta } from '../utils/apiResponse';

export class ProjectService {
  /**
   * Submit a new project for review.
   * Enforces duplicate repository submission prevention and server-controlled status.
   */
  static async submitProject(studentId: string, input: CreateProjectInput) {
    const normalizedRepo = normalizeRepoUrl(input.repoUrl);

    // 1. Business Logic Duplicate Check: Verify student has not submitted this repository
    const existing = await prisma.project.findUnique({
      where: {
        student_repo_unique: {
          studentId,
          repoUrl: normalizedRepo,
        },
      },
    });

    if (existing) {
      throw new AppError(
        'You have already submitted this repository URL. Duplicate submissions for the same repository are not allowed.',
        409
      );
    }

    try {
      // 2. Persist project in database. Status is strictly set to PENDING on the server.
      const project = await prisma.project.create({
        data: {
          name: input.name.trim(),
          repoUrl: normalizedRepo,
          liveUrl: input.liveUrl.trim(),
          description: input.description.trim(),
          status: ProjectStatus.PENDING,
          studentId,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return project;
    } catch (err: unknown) {
      // Safeguard for race condition duplicate submissions
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AppError(
          'You have already submitted this repository URL. Duplicate submissions for the same repository are not allowed.',
          409
        );
      }
      throw err;
    }
  }

  /**
   * Fetch paginated list of submissions belonging to the authenticated student.
   */
  static async getStudentProjects(studentId: string, page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [items, totalItems] = await prisma.$transaction([
      prisma.project.findMany({
        where: { studentId },
        skip,
        take: safeLimit,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.project.count({
        where: { studentId },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / safeLimit);

    const pagination: PaginationMeta = {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }

  /**
   * Aggregated submission statistics for the authenticated student.
   */
  static async getStudentStats(studentId: string) {
    const [total, pending, approved, rejected] = await prisma.$transaction([
      prisma.project.count({ where: { studentId } }),
      prisma.project.count({ where: { studentId, status: ProjectStatus.PENDING } }),
      prisma.project.count({ where: { studentId, status: ProjectStatus.APPROVED } }),
      prisma.project.count({ where: { studentId, status: ProjectStatus.REJECTED } }),
    ]);

    return { total, pending, approved, rejected };
  }

  /**
   * Fetch single project by ID with strict ownership / role authorization.
   */
  static async getProjectById(projectId: string, user: AuthenticatedUser) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found.', 404);
    }

    // Role check: Students may only view their own projects
    if (user.role === 'STUDENT' && project.studentId !== user.id) {
      throw new AppError(
        'Forbidden: You are not authorized to view another student’s project.',
        403
      );
    }

    return project;
  }

  /**
   * Fetch paginated and filtered list of projects for Mentor/Admin review dashboard.
   */
  static async getAllProjects(query: ProjectQueryInput) {
    const safePage = Math.max(1, query.page);
    const safeLimit = Math.min(100, Math.max(1, query.limit));
    const skip = (safePage - 1) * safeLimit;

    // Build database where clause
    const where: Prisma.ProjectWhereInput = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as ProjectStatus;
    }

    if (query.search && query.search.trim().length > 0) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch items and count atomically
    const [items, totalItems] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / safeLimit);

    const pagination: PaginationMeta = {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }

  /**
   * System-wide statistics for Mentor/Admin dashboard.
   * Queries full PostgreSQL dataset.
   */
  static async getGlobalStats() {
    const [total, pending, approved, rejected] = await prisma.$transaction([
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.PENDING } }),
      prisma.project.count({ where: { status: ProjectStatus.APPROVED } }),
      prisma.project.count({ where: { status: ProjectStatus.REJECTED } }),
    ]);

    return { total, pending, approved, rejected };
  }

  /**
   * Execute review action (Approve / Reject) on a project.
   */
  static async reviewProject(
    projectId: string,
    reviewerId: string,
    input: ReviewProjectInput
  ) {
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError('Project not found.', 404);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: input.status as ProjectStatus,
        reviewComment: input.reviewComment ? input.reviewComment.trim() : null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }
}
