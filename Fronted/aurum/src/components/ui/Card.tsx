import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-xs ${
        hoverable
          ? 'hover:shadow-md hover:border-[#CBD5E1] transition-all duration-200 cursor-pointer'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`p-5 pb-3 border-b border-[#F1F5F9] flex items-center justify-between gap-4 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-[#1E293B] tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`p-5 ${className}`}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`p-4 px-5 border-t border-[#F1F5F9] bg-[#F8FAFC] rounded-b-xl flex items-center justify-between text-xs text-[#64748B] ${className}`}>
    {children}
  </div>
);
