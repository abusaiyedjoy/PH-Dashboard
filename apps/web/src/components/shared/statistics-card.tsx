import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  colorScheme?: 'indigo' | 'amber' | 'emerald' | 'rose';
  className?: string;
}

export function StatisticsCard({
  title,
  value,
  icon: Icon,
  description,
  colorScheme = 'indigo',
  className,
}: StatisticsCardProps) {
  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-200',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-200',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'hover:border-rose-200',
    },
  };

  const scheme = colorStyles[colorScheme];

  return (
    <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-md', scheme.border, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h4 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </h4>
            {description && (
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <div className={cn('rounded-xl p-3', scheme.bg)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
