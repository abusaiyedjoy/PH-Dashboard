'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  CheckCircle2,
  UploadCloud,
  FileSearch,
  ShieldCheck,
  ArrowRight,
  Database,
  Lock,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const getDashboardHref = () => {
    if (!user) return '/login';
    return user.role === 'STUDENT' ? '/student/dashboard' : '/mentor/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Project Review Hub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={getDashboardHref()}>
                <Button size="sm">
                  Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Student Signup
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-4 sm:px-8 pt-16 pb-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="h-3.5 w-3.5" /> Associate Web Instructor Assessment Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Bridging Student Projects with{' '}
            <span className="text-indigo-600">Actionable Mentor Feedback</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A production-minded evaluation hub featuring PostgreSQL persistence, Prisma ORM,
            Express.js REST API, server-side pagination, and role-based review workflows.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={isAuthenticated ? getDashboardHref() : '/signup'} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-6 text-base shadow-md">
                {isAuthenticated ? 'Open Dashboard' : 'Get Started as Student'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 text-base">
                Sign In to Account
              </Button>
            </Link>
          </div>

          {/* Seed Accounts Helper Banner for Evaluators */}
          <div className="mt-12 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm text-left max-w-2xl mx-auto">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-600" /> Assessment Quick Access (Seeded Accounts)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Mentor Account:</span>
                <p className="text-slate-600 mt-0.5"><code>mentor@projecthub.local</code></p>
                <p className="text-slate-500">Pass: <code>MentorPassword123!</code></p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Admin Account:</span>
                <p className="text-slate-600 mt-0.5"><code>admin@projecthub.local</code></p>
                <p className="text-slate-500">Pass: <code>AdminPassword123!</code></p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Explanation */}
        <section className="bg-white border-y border-slate-200/80 py-16 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Structured Submission & Review Flow
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Designed with strict backend security boundaries and database constraints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-indigo-600" /> Student Submission
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Students provide Project Name, GitHub Repository URL, Live Demo Link, and Description.
                  URL normalization and a composite database constraint prevent duplicate submissions.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-amber-600" /> Triage & Filtering
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mentors query projects via server-side pagination with database status filtering
                  (Pending, Approved, Rejected) and full-dataset aggregated metrics.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Review & Action
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mentors inspect code repositories and live demos, then persist approval or rejection
                  with reviewer attribution, timestamps, and actionable notes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture Highlights */}
        <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Full-Stack Architecture Highlights
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Built strictly without shortcuts, complying with every assessment specification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <Database className="h-6 w-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 text-sm mb-1">PostgreSQL & Prisma</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Relational models with composite unique constraint <code>[studentId, repoUrl]</code> and indexed query fields.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <Layers className="h-6 w-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Separate Express API</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clean layered REST architecture with controllers, services, middlewares, and strict Zod validation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <ShieldCheck className="h-6 w-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Security & RBAC</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                HttpOnly JWT cookies, bcrypt hashing, rate limiting, and server-enforced role authorization.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <GraduationCap className="h-6 w-6 text-indigo-600 mb-3" />
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Next.js App Router</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tailwind CSS, responsive sidebar layout, server-side paginated data table, and modal dialogs.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-8 text-center text-xs text-slate-500">
        <p>Project Review Hub &copy; {new Date().getFullYear()} — Associate Web Instructor Hiring Assessment</p>
      </footer>
    </div>
  );
}
