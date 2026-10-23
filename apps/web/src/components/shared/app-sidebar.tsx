'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  UploadCloud,
  FileCode2,
  CheckSquare2,
  GraduationCap,
  LogOut,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, isStudent, isMentor, isAdmin, logout } = useAuth();

  const studentNavItems = [
    {
      title: 'Overview',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Submit Project',
      href: '/student/submit',
      icon: UploadCloud,
    },
    {
      title: 'My Submissions',
      href: '/student/submissions',
      icon: FileCode2,
    },
  ];

  const mentorNavItems = [
    {
      title: 'Dashboard',
      href: '/mentor/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Review Projects',
      href: '/mentor/projects',
      icon: CheckSquare2,
    },
  ];

  const navItems = isStudent ? studentNavItems : mentorNavItems;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100 p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                ReviewHub
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Instructor Assessment</p>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User Role Tag */}
        {user && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">Portal Role</span>
            <Badge
              variant={
                user.role === 'STUDENT'
                  ? 'default'
                  : user.role === 'MENTOR'
                  ? 'success'
                  : 'warning'
              }
            >
              {user.role}
            </Badge>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Sign Out */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 shadow-md">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
