import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma, Role } from '@project-review-hub/database';
import { ENV } from '../config/env';
import { SignupInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../middlewares/error.middleware';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export class AuthService {
  /**
   * Register a new student account.
   * Public registration always assigns the STUDENT role.
   */
  static async signup(input: SignupInput): Promise<{ user: SafeUser; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError(
        'An account with this email address already exists. Please log in.',
        409
      );
    }

    // Secure password hashing with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user strictly with STUDENT role
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as unknown as NonNullable<SignOptions['expiresIn']>,
    };

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      ENV.JWT_SECRET,
      signOptions
    );

    return { user, token };
  }

  /**
   * Authenticate user credentials and issue a JWT token.
   * Uses timing-safe generic failure message.
   */
  static async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const signOptions: SignOptions = {
      expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as unknown as NonNullable<SignOptions['expiresIn']>,
    };

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      ENV.JWT_SECRET,
      signOptions
    );

    return { user: safeUser, token };
  }

  /**
   * Get safe profile of currently authenticated user.
   */
  static async getCurrentUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    return user;
  }
}
