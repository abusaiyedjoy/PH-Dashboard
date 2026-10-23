'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onOpenMobileNav: () => void;
  title?: string;
  description?: string;
}

export function Header({ onOpenMobileNav, title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-500 hidden sm:block">{description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
