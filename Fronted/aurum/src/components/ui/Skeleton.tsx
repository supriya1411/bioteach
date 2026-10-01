import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}> = ({ className = '', variant = 'text' }) => {
  const variantStyles = {
    text: 'h-4 rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 ${variantStyles[variant]} ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => {
  return (
    <div className="w-full divide-y divide-slate-100">
      <div className="flex gap-4 py-3 px-4 bg-slate-50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-4 px-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-6 w-16" variant="circular" />
    </div>
    <Skeleton className="h-8 w-24" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);
