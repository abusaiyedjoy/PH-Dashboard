'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, GlobalStats } from '@/types';
import { StatisticsCard } from '@/components/shared/statistics-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ReviewDialog } from '@/components/shared/review-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FolderGit2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Github,
  ArrowRight,
  CheckSquare2,
  RefreshCw,
} from 'lucide-react';

export default function MentorDashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [pendingQueue, setPendingQueue] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [reviewingProject, setReviewingProject] = useState<Project | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, pendingData] = await Promise.all([
        api.projects.getGlobalStats(),
        api.projects.getAll({ status: 'PENDING', limit: 5 }),
      ]);
      setStats(statsData);
      setPendingQueue(pendingData.items);
    } catch (err) {
      console.error('Failed to load mentor dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewSubmit = async (status: 'APPROVED' | 'REJECTED', comment?: string) => {
    if (!reviewingProject) return;

    await api.projects.review(reviewingProject.id, {
      status,
      reviewComment: comment,
    });

    toast.success(
      `Project "${reviewingProject.name}" was marked as ${status.toLowerCase()}!`
    );

    // Refresh dashboard stats and pending queue
    await loadData();
  };

  const openReviewModal = (project: Project, action: 'APPROVED' | 'REJECTED') => {
    setReviewingProject(project);
    setReviewAction(action);
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Instructor Evaluation Hub
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
            Review Dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-xl">
            Inspect incoming student code submissions, test live deployments, and provide constructive feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>

          <Link href="/mentor/projects">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <CheckSquare2 className="mr-1.5 h-4 w-4" />
              All Projects Table
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Metrics Row */}
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
            description="All platform submissions"
          />
          <StatisticsCard
            title="Pending Review"
            value={stats?.pending ?? 0}
            icon={Clock}
            colorScheme="amber"
            description="Requires mentor evaluation"
          />
          <StatisticsCard
            title="Approved"
            value={stats?.approved ?? 0}
            icon={CheckCircle2}
            colorScheme="emerald"
            description="Passed assessment standards"
          />
          <StatisticsCard
            title="Rejected"
            value={stats?.rejected ?? 0}
            icon={XCircle}
            colorScheme="rose"
            description="Requires student revision"
          />
        </div>
      )}

      {/* Pending Triage Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pending Review Queue ({stats?.pending ?? 0})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Earliest unreviewed submissions requiring mentor evaluation
            </p>
          </div>

          <Link href="/mentor/projects?status=PENDING">
            <Button variant="ghost" size="sm" className="text-xs">
              View All Pending <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingQueue.length === 0 ? (
            <EmptyState
              title="Inbox zero! No pending submissions"
              description="All submitted student projects have been reviewed and evaluated."
              icon={CheckCircle2}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingQueue.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between py-4 gap-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/mentor/projects/${project.id}`}
                        className="font-semibold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        Student: <strong className="text-slate-700">{project.student.name}</strong> ({project.student.email})
                      </span>
                      <span>•</span>
                      <span>Submitted: {formatDate(project.createdAt)}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 max-w-2xl">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 lg:pt-0">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 px-2.5 py-1.5 transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" /> Repo
                    </a>

                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 px-2.5 py-1.5 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Demo
                    </a>

                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => openReviewModal(project, 'APPROVED')}
                      className="h-8 text-xs px-2.5"
                    >
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openReviewModal(project, 'REJECTED')}
                      className="h-8 text-xs px-2.5"
                    >
                      Reject
                    </Button>

                    <Link href={`/mentor/projects/${project.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs px-2.5">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {reviewingProject && (
        <ReviewDialog
          isOpen={!!reviewingProject}
          onClose={() => setReviewingProject(null)}
          projectName={reviewingProject.name}
          action={reviewAction}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
