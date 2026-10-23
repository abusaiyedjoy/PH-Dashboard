'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Project, StudentStats } from '@/types';
import { StatisticsCard } from '@/components/shared/statistics-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  FolderGit2,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ExternalLink,
  Github,
  ArrowRight,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, projectsData] = await Promise.all([
          api.projects.getMyStats(),
          api.projects.getMyProjects({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentProjects(projectsData.items);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 sm:p-8 text-white shadow-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Student Overview
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}!
          </h2>
          <p className="mt-2 text-sm text-indigo-100 max-w-xl">
            Track your coding assignments, review status, and mentor feedback in one place.
          </p>
        </div>

        <Link href="/student/submit">
          <Button variant="secondary" size="lg" className="shadow-sm font-semibold text-indigo-900">
            <PlusCircle className="mr-2 h-5 w-5" />
            Submit New Project
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            title="Total Projects"
            value={stats?.total ?? 0}
            icon={FolderGit2}
            colorScheme="indigo"
            description="All submitted repositories"
          />
          <StatisticsCard
            title="Pending Review"
            value={stats?.pending ?? 0}
            icon={Clock}
            colorScheme="amber"
            description="Awaiting mentor review"
          />
          <StatisticsCard
            title="Approved"
            value={stats?.approved ?? 0}
            icon={CheckCircle2}
            colorScheme="emerald"
            description="Passed assessment criteria"
          />
          <StatisticsCard
            title="Needs Revision"
            value={stats?.rejected ?? 0}
            icon={XCircle}
            colorScheme="rose"
            description="Feedback provided for resubmission"
          />
        </div>
      )}

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Your latest submitted projects and current status
            </p>
          </div>
          {recentProjects.length > 0 && (
            <Link href="/student/submissions">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <EmptyState
              title="No submissions yet"
              description="You have not submitted any projects for mentor review yet."
              actionText="Submit Your First Project"
              actionHref="/student/submit"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-semibold text-slate-900 text-sm">{project.name}</h4>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Submitted: {formatDate(project.createdAt)}</span>
                      {project.reviewedAt && (
                        <span>Reviewed: {formatDate(project.reviewedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 px-2.5 py-1.5 transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" /> Code
                    </a>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 px-2.5 py-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Demo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
