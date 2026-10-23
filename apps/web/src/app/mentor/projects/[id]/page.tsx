'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Project } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { ReviewDialog } from '@/components/shared/review-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Github,
  ExternalLink,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.projects.getById(projectId);
      setProject(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  const handleReviewSubmit = async (status: 'APPROVED' | 'REJECTED', comment?: string) => {
    if (!project) return;

    await api.projects.review(project.id, {
      status,
      reviewComment: comment,
    });

    toast.success(`Project "${project.name}" marked as ${status.toLowerCase()}!`);
    await fetchProject();
  };

  const openReview = (action: 'APPROVED' | 'REJECTED') => {
    setReviewAction(action);
    setIsReviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Project Not Found or Restricted</h3>
        <p className="text-sm text-slate-500">{error || 'This project could not be found.'}</p>
        <Link href="/mentor/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Project List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/mentor/projects"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Projects Table
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="success"
            onClick={() => openReview('APPROVED')}
            className="shadow-sm"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve Project
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => openReview('REJECTED')}
            className="shadow-sm"
          >
            <XCircle className="mr-1.5 h-4 w-4" /> Reject Project
          </Button>
        </div>
      </div>

      {/* Main Project Overview Card */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Project Overview
              </span>
              <CardTitle className="text-2xl mt-1 text-slate-900">{project.name}</CardTitle>
            </div>
            <StatusBadge status={project.status} className="text-sm py-1 px-3" />
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Info */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <User className="h-3.5 w-3.5 text-indigo-600" /> Student Profile
              </span>
              <p className="font-semibold text-slate-900 text-sm">{project.student.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{project.student.email}</p>
            </div>

            {/* Timestamps */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Submission Timeline
              </span>
              <p className="text-xs text-slate-700">
                Submitted:{' '}
                <strong className="text-slate-900">{formatDate(project.createdAt)}</strong>
              </p>
              {project.reviewedAt && (
                <p className="text-xs text-slate-700 mt-1">
                  Last Evaluated:{' '}
                  <strong className="text-slate-900">{formatDate(project.reviewedAt)}</strong>
                </p>
              )}
            </div>
          </div>

          {/* External Code & Deployment Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-900 p-2 text-white">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Source Repository</span>
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                    GitHub Repository
                  </span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            </a>

            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-600 p-2 text-white">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Live Deployment</span>
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                    Production Demo
                  </span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            </a>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Project Description & Highlights
            </h4>
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {project.description}
            </div>
          </div>

          {/* Existing Review Records */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-indigo-600" /> Instructor Evaluation Notes
            </h4>

            {project.reviewedAt ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Reviewed by:{' '}
                    <strong className="text-slate-900">
                      {project.reviewer?.name || 'Assigned Instructor'}
                    </strong>
                  </span>
                  <span>{formatDate(project.reviewedAt)}</span>
                </div>

                {project.reviewComment ? (
                  <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                    {project.reviewComment}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No additional comment recorded.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                This project is currently pending review. Use the &quot;Approve Project&quot; or &quot;Reject Project&quot;
                buttons above to evaluate this submission.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {isReviewOpen && (
        <ReviewDialog
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          projectName={project.name}
          action={reviewAction}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
