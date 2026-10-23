import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import {
  createProjectSchema,
  reviewProjectSchema,
  projectQuerySchema,
} from '../validators/project.validator';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';

export class ProjectController {
  /**
   * POST /api/projects
   * STUDENT only: Submit a new project.
   */
  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createProjectSchema.parse(req.body);
      const studentId = req.user!.id;

      const project = await ProjectService.submitProject(studentId, validated);
      sendSuccess(res, project, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/projects/my
   * STUDENT only: Paginated list of student's own projects.
   */
  static async getMyProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const { items, pagination } = await ProjectService.getStudentProjects(
        req.user!.id,
        page,
        limit
      );

      sendPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/projects/my/stats
   * STUDENT only: Aggregated submission counts for current student.
   */
  static async getMyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectService.getStudentStats(req.user!.id);
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/projects/:id
   * Authenticated: Student can only view own project; Mentor/Admin can view any.
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user!);
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/projects
   * MENTOR or ADMIN only: Server-side paginated and filtered project list.
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = projectQuerySchema.parse(req.query);
      const { items, pagination } = await ProjectService.getAllProjects(validatedQuery);
      sendPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/projects/stats
   * MENTOR or ADMIN only: Global statistics from database.
   */
  static async getGlobalStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectService.getGlobalStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/projects/:id/review
   * MENTOR or ADMIN only: Approve or Reject a project.
   */
  static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = reviewProjectSchema.parse(req.body);
      const updated = await ProjectService.reviewProject(
        req.params.id,
        req.user!.id,
        validated
      );

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}
