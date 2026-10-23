import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  action: 'APPROVED' | 'REJECTED';
  onSubmit: (status: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void>;
}

export function ReviewDialog({
  isOpen,
  onClose,
  projectName,
  action,
  onSubmit,
}: ReviewDialogProps) {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprove = action === 'APPROVED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit(action, comment.trim() || undefined);
      setComment('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Approve Project' : 'Reject Project'}
      description={`Reviewing "${projectName}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border p-3.5 text-sm bg-slate-50/50">
          {isApprove ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="text-slate-700">
                You are marking this submission as <strong>Approved</strong>. The student will be notified of their success.
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <span className="text-slate-700">
                You are marking this submission as <strong>Rejected</strong>. We strongly recommend providing constructive feedback.
              </span>
            </>
          )}
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Review Feedback / Notes {isApprove ? '(Optional)' : '(Recommended)'}
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isApprove
                ? 'e.g., Clean architecture and comprehensive test coverage. Great job!'
                : 'e.g., The live demo link is returning 404 and repository is missing a README. Please update and re-submit.'
            }
            rows={4}
            maxLength={1000}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>Constructive feedback helps students improve</span>
            <span>{comment.length}/1000</span>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant={isApprove ? 'success' : 'danger'}
            isLoading={isLoading}
          >
            {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
