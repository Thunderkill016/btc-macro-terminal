import React from 'react';

export interface StatusPillProps {
  label: React.ReactNode;
  tone?: 'bullish' | 'bearish' | 'warning' | 'neutral' | 'cyan' | 'purple';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Atomic Status Pill Primitive.
 * High-contrast semantic badges with glowing specular borders.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  tone = 'neutral',
  size = 'sm',
  pulse = false,
  icon,
  className = '',
  onClick,
}) => {
  const toneStyles = {
    bullish:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 shadow-emerald-950/20',
    bearish: 'bg-rose-500/10 text-rose-300 border-rose-500/25 shadow-rose-950/20',
    warning:
      'bg-amber-500/10 text-amber-300 border-amber-500/25 shadow-amber-950/20',
    neutral: 'bg-white/[0.04] text-slate-300 border-white/[0.08]',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 shadow-cyan-950/20',
    purple:
      'bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-purple-950/20',
  }[tone];

  const dotColor = {
    bullish: 'bg-emerald-400',
    bearish: 'bg-rose-400',
    warning: 'bg-amber-400',
    neutral: 'bg-slate-400',
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
  }[tone];

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-mono font-medium rounded-full border shadow-sm transition-colors ${
        onClick ? 'cursor-pointer hover:bg-white/[0.08]' : ''
      } ${toneStyles} ${sizeStyles} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
