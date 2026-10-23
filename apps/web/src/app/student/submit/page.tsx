'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  UploadCloud,
  Github,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function StudentSubmitPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Project name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Project name must be at least 2 characters';
    }

    const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

    if (!repoUrl.trim()) {
      errors.repoUrl = 'Repository URL is required';
    } else if (!urlRegex.test(repoUrl.trim())) {
      errors.repoUrl = 'Must be a valid HTTP or HTTPS URL';
    } else if (
      !repoUrl.includes('github.com') &&
      !repoUrl.includes('gitlab.com')
    ) {
      errors.repoUrl = 'Repository must be hosted on GitHub or GitLab';
    }

    if (!liveUrl.trim()) {
      errors.liveUrl = 'Live demo URL is required';
    } else if (!urlRegex.test(liveUrl.trim())) {
      errors.liveUrl = 'Must be a valid HTTP or HTTPS URL';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 20) {
      errors.description = `Description must be at least 20 characters (current: ${description.trim().length})`;
    } else if (description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.projects.submit({
        name: name.trim(),
        repoUrl: repoUrl.trim(),
        liveUrl: liveUrl.trim(),
        description: description.trim(),
      });

      toast.success('Project submitted successfully! It is now pending mentor review.');

      // Reset form fields
      setName('');
      setRepoUrl('');
      setLiveUrl('');
      setDescription('');
      setFieldErrors({});

      // Navigate to submissions list
      router.push('/student/submissions');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors && err.errors.length > 0) {
          const mapped: Record<string, string> = {};
          err.errors.forEach((e) => {
            mapped[e.field] = e.message;
          });
          setFieldErrors(mapped);
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('An unexpected error occurred while submitting your project.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const descLength = description.trim().length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Submit New Project</h2>
        <p className="text-sm text-slate-500 mt-1">
          Provide your repository and live demo link for web instructor evaluation.
        </p>
      </div>

      {generalError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-900">Submission Blocked</h4>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Duplicate Prevention Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
        <Info className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Duplicate Submission Policy:</span> You cannot submit
          the same repository URL twice. Ensure your GitHub repo has a comprehensive README
          and working live deployment.
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Project Details</CardTitle>
          <CardDescription>
            All fields are strictly validated on both client and Express server
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g., E-Commerce Inventory Dashboard"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                error={fieldErrors.name}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Repository URL */}
            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-slate-700 mb-1">
                GitHub / GitLab Repository URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="repoUrl"
                  type="url"
                  placeholder="https://github.com/your-username/your-repository"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (fieldErrors.repoUrl) setFieldErrors({ ...fieldErrors, repoUrl: '' });
                  }}
                  error={fieldErrors.repoUrl}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Must be an active public or accessible repository on GitHub or GitLab.
              </p>
            </div>

            {/* Live Demo URL */}
            <div>
              <label htmlFor="liveUrl" className="block text-sm font-medium text-slate-700 mb-1">
                Live Deployment URL <span className="text-rose-500">*</span>
              </label>
              <Input
                id="liveUrl"
                type="url"
                placeholder="https://your-project.vercel.app"
                value={liveUrl}
                onChange={(e) => {
                  setLiveUrl(e.target.value);
                  if (fieldErrors.liveUrl) setFieldErrors({ ...fieldErrors, liveUrl: '' });
                }}
                error={fieldErrors.liveUrl}
                disabled={isSubmitting}
                required
              />
              <p className="mt-1 text-xs text-slate-400">
                Vercel, Netlify, Render, or another live preview domain.
              </p>
            </div>

            {/* Description with Character Counter */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Project Description & Key Technical Highlights{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-xs font-medium ${
                    descLength < 20
                      ? 'text-amber-600'
                      : descLength > 2000
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  {descLength} / 2000 chars (min 20)
                </span>
              </div>
              <Textarea
                id="description"
                rows={5}
                placeholder="Explain the project purpose, architecture, state management, dependencies used, and instructions on how to test key features..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description)
                    setFieldErrors({ ...fieldErrors, description: '' });
                }}
                error={fieldErrors.description}
                disabled={isSubmitting}
                maxLength={2000}
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="px-6"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Submit Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
