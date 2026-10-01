import React from 'react';
import { CheckCircle2, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'check' | 'inbox' | React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction,
  icon = 'inbox',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
        {icon === 'check' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : icon === 'inbox' ? (
          <Inbox className="w-6 h-6 text-slate-400" />
        ) : (
          icon
        )}
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
