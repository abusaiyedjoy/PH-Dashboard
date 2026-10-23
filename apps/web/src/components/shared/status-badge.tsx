import { ProjectStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="warning" className={className}>
          <Clock className="mr-1 h-3.5 w-3.5 text-amber-600" />
          <span>Pending</span>
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
          <span>Approved</span>
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger" className={className}>
          <XCircle className="mr-1 h-3.5 w-3.5 text-rose-600" />
          <span>Rejected</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={className}>
          <span>{status}</span>
        </Badge>
      );
  }
}
