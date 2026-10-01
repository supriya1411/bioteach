import React from 'react';

interface GaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  colorScheme?: 'health' | 'risk' | 'primary';
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  showValue = true,
  colorScheme = 'health',
  className = '',
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  const getColor = () => {
    if (colorScheme === 'health') {
      if (normalizedValue >= 75) return '#10B981'; // Green (Healthy)
      if (normalizedValue >= 50) return '#F59E0B'; // Orange (At Risk)
      return '#EF4444'; // Red (Critical)
    }
    if (colorScheme === 'risk') {
      if (normalizedValue >= 75) return '#EF4444'; // High Risk (Red)
      if (normalizedValue >= 45) return '#F59E0B'; // Medium Risk (Orange)
      return '#10B981'; // Low Risk (Green)
    }
    return '#4F46E5'; // Primary Indigo
  };

  const strokeColor = getColor();

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {showValue && (
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold tracking-tight text-[#1E293B]">{normalizedValue}</span>
            <span className="text-[10px] uppercase font-semibold text-[#64748B]">/ 100</span>
          </div>
        )}
      </div>
      {(label || sublabel) && (
        <div className="mt-2 text-center">
          {label && <p className="text-xs font-semibold text-[#1E293B]">{label}</p>}
          {sublabel && <p className="text-[11px] text-[#64748B]">{sublabel}</p>}
        </div>
      )}
    </div>
  );
};
