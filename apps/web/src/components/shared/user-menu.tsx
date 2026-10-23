'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleBadgeVariants = {
    STUDENT: 'default' as const,
    MENTOR: 'success' as const,
    ADMIN: 'warning' as const,
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium text-xs shadow-sm">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-slate-800 leading-tight">{user.name}</p>
          <p className="text-xs text-slate-500 leading-tight">{user.email}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white p-2 shadow-lg border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <div className="mt-2">
              <Badge variant={roleBadgeVariants[user.role] || 'secondary'}>
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
