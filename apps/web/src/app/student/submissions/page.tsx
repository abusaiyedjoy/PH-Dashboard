'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Project, PaginationMeta } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  Github,
  ExternalLink,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';

export default function StudentSubmissionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchSubmissions = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    try {
      const data = await api.projects.getMyProjects({ page, limit });
      setProjects(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch student submissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions(1, 10);
  }, [fetchSubmissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Submissions</h2>
          <p className="text-sm text-slate-500 mt-1">
            Review the status of your submitted projects and feedback from instructors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubmissions(pagination.page, pagination.limit)}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Link href="/student/submit">
            <Button size="sm">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Submit Project
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6 border-b border-slate-100">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-indigo-600" />
            Submitted Projects ({pagination.totalItems})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No project submissions found"
                description="You haven't submitted any projects yet. Complete an assignment and submit your repository for evaluation."
                actionText="Submit Project Now"
                actionHref="/student/submit"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Repository & Demo</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Review Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <div>
                          <span>{project.name}</span>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-xs font-normal">
                            {project.description}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 border border-slate-200 rounded px-2 py-1"
                          >
                            <Github className="h-3 w-3" /> Code
                          </a>
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 border border-slate-200 rounded px-2 py-1"
                          >
                            <ExternalLink className="h-3 w-3" /> Demo
                          </a>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(project.createdAt)}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={project.status} />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                          className="text-xs h-8"
                        >
                          <MessageSquare className="mr-1 h-3.5 w-3.5 text-slate-500" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="border-t border-slate-100 px-4">
              <PaginationControls
                pagination={pagination}
                onPageChange={(page) => fetchSubmissions(page, pagination.limit)}
                onLimitChange={(limit) => fetchSubmissions(1, limit)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Detail & Review Feedback Modal */}
      {selectedProject && (
        <Dialog
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          description="Detailed submission and instructor feedback record"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-500">Current Status</span>
              <StatusBadge status={selectedProject.status} />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Project Description
              </h4>
              <p className="text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed text-xs">
                {selectedProject.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 block mb-1">Repository</span>
                <a
                  href={selectedProject.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:underline flex items-center gap-1 truncate"
                >
                  <Github className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{selectedProject.repoUrl}</span>
                </a>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <span className="text-slate-400 block mb-1">Live Demo</span>
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-600 hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{selectedProject.liveUrl}</span>
                </a>
              </div>
            </div>

            {/* Instructor Review Feedback */}
            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Instructor Review Feedback
              </h4>

              {selectedProject.reviewedAt ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Reviewed by:{' '}
                      <strong className="text-slate-800">
                        {selectedProject.reviewer?.name || 'Instructor'}
                      </strong>
                    </span>
                    <span>{formatDate(selectedProject.reviewedAt)}</span>
                  </div>

                  {selectedProject.reviewComment ? (
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 whitespace-pre-wrap leading-relaxed">
                      {selectedProject.reviewComment}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No additional comments were written for this review.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                  This project is currently pending evaluation. An instructor will review it soon.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedProject(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
