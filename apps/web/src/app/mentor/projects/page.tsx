'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Project, PaginationMeta, ProjectStatus } from '@/types';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { ReviewDialog } from '@/components/shared/review-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Github,
  ExternalLink,
  RefreshCw,
  FolderGit2,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function MentorProjectsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = searchParams.get('status') || 'ALL';

  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [reviewingProject, setReviewingProject] = useState<Project | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.projects.getAll({
        page,
        limit,
        status: statusFilter,
        search: debouncedSearch || undefined,
      });

      setProjects(data.items);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleReviewSubmit = async (status: 'APPROVED' | 'REJECTED', comment?: string) => {
    if (!reviewingProject) return;

    await api.projects.review(reviewingProject.id, {
      status,
      reviewComment: comment,
    });

    toast.success(
      `Project "${reviewingProject.name}" was marked as ${status.toLowerCase()}!`
    );

    // Refresh current page
    await fetchProjects();
  };

  const openReviewModal = (project: Project, action: 'APPROVED' | 'REJECTED') => {
    setReviewingProject(project);
    setReviewAction(action);
  };

  const statusOptions = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Project Submissions</h2>
          <p className="text-sm text-slate-500 mt-1">
            Server-side paginated repository submissions with live database filtering
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjects}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Server-Side Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0" />
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Server-Side Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search project or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paginated Data Table */}
      <Card>
        <CardHeader className="p-4 sm:p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-indigo-600" />
            Matching Records ({pagination.totalItems})
          </CardTitle>
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No projects match criteria"
                description={
                  searchQuery || statusFilter !== 'ALL'
                    ? 'No submissions found matching the selected filter or search term.'
                    : 'No projects have been submitted yet.'
                }
                actionText={searchQuery || statusFilter !== 'ALL' ? 'Reset Filters' : undefined}
                onAction={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Repository & Demo</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-semibold text-slate-900">
                        <Link
                          href={`/mentor/projects/${project.id}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs font-normal">
                          {project.description}
                        </p>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-900">{project.student.name}</div>
                        <div className="text-slate-500">{project.student.email}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
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
                        <div className="flex items-center justify-end gap-1.5">
                          {project.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => openReviewModal(project, 'APPROVED')}
                                className="h-8 text-xs px-2"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => openReviewModal(project, 'REJECTED')}
                                className="h-8 text-xs px-2"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openReviewModal(
                                  project,
                                  project.status === 'APPROVED' ? 'REJECTED' : 'APPROVED'
                                )
                              }
                              className="h-8 text-xs px-2 text-slate-600"
                            >
                              Re-evaluate
                            </Button>
                          )}

                          <Link href={`/mentor/projects/${project.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4 text-slate-500" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination.totalItems > 0 && (
            <div className="border-t border-slate-100 px-4">
              <PaginationControls
                pagination={pagination}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(newLimit) => setLimit(newLimit)}
              />
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
