import React from 'react';

export interface MetricValueProps {
  value: string | number;
  label?: string;
  prefix?: string;
  suffix?: string;
  tone?: 'neutral' | 'bullish' | 'bearish' | 'warning' | 'accent' | 'muted';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  delta?: {
    value: string | number;
    direction?: 'up' | 'down' | 'neutral';
    prefix?: string;
    suffix?: string;
  };
  className?: string;
  subValue?: string;
}

/**
 * Atomic Quantitative Metric Primitive.
 * Strictly adheres to `font-mono tabular-nums` for institutional financial readability.
 */
export const MetricValue: React.FC<MetricValueProps> = ({
  value,
  label,
  prefix,
  suffix,
  tone = 'neutral',
  size = 'md',
  delta,
  className = '',
  subValue,
}) => {
  const toneStyles = {
    neutral: 'text-white',
    bullish: 'text-emerald-400',
    bearish: 'text-rose-400',
    warning: 'text-amber-400',
    accent: 'text-cyan-400',
    muted: 'text-slate-400',
  }[tone];

  const sizeStyles = {
    xs: 'text-xs font-semibold',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-bold tracking-tight',
    hero: 'text-3xl sm:text-4xl font-extrabold tracking-tight',
  }[size];

  const deltaTone =
    delta?.direction === 'up'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : delta?.direction === 'down'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      : 'text-slate-400 bg-white/[0.04] border-white/[0.08]';

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-2">
        <span className={`font-mono tabular-nums ${toneStyles} ${sizeStyles}`}>
          {prefix && <span className="opacity-75 mr-0.5 text-[0.85em]">{prefix}</span>}
          {value}
          {suffix && <span className="opacity-75 ml-1 text-[0.85em]">{suffix}</span>}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${deltaTone}`}
          >
            {delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '•'}
            {delta.prefix}
            {delta.value}
            {delta.suffix}
          </span>
        )}
      </div>
      {subValue && (
        <span className="text-[11px] font-mono text-slate-400 mt-0.5">
          {subValue}
        </span>
      )}
    </div>
  );
};
