'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { Skeleton } from '@/components/ui/skeleton';

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, isStudent } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isStudent) {
        // Enforce RBAC on frontend navigation as well
        router.push('/student/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isStudent, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role === 'STUDENT') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AppSidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        <Header
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          title="Mentor Evaluation Portal"
          description="Code review, assessment grading, and submission triage"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
