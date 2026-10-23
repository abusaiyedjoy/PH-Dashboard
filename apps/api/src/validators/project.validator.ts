import { z } from 'zod';

const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(2, 'Project name must be at least 2 characters')
      .max(150, 'Project name cannot exceed 150 characters'),
    repoUrl: z
      .string({ required_error: 'Repository URL is required' })
      .trim()
      .regex(urlRegex, 'Must be a valid HTTP or HTTPS URL')
      .refine(
        (url) => {
          try {
            const parsed = new URL(url);
            return parsed.hostname.includes('github.com') || parsed.hostname.includes('gitlab.com');
          } catch {
            return false;
          }
        },
        { message: 'Repository URL must be a valid GitHub or GitLab repository' }
      ),
    liveUrl: z
      .string({ required_error: 'Live demo URL is required' })
      .trim()
      .regex(urlRegex, 'Must be a valid HTTP or HTTPS URL'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(20, 'Description must be at least 20 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
  })
  .strict();

export const reviewProjectSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      required_error: 'Review status must be either APPROVED or REJECTED',
    }),
    reviewComment: z
      .string()
      .trim()
      .max(1000, 'Review comment cannot exceed 1000 characters')
      .optional()
      .nullable(),
  })
  .strict();

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
    .default('ALL')
    .optional(),
  search: z.string().trim().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ReviewProjectInput = z.infer<typeof reviewProjectSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
