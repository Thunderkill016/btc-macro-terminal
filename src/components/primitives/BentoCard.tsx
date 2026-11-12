import React from 'react';

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'specular' | 'interactive' | 'accent';
  header?: React.ReactNode;
  title?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Atomic Bento Card Primitive — Fey × Linear Obsidian Design System.
 * Background: #0A0E17 with border-[#EEF0F5] specular hairlines.
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = '',
  variant = 'default',
  header,
  title,
  badge,
  action,
  ...props
}) => {
  const baseStyles =
    'relative rounded-2xl bg-white border border-[#EEF0F5] shadow-2xl backdrop-blur-xl transition-all duration-200 overflow-hidden';

  const variantStyles = {
    default: 'hover:border-[#EEF0F5]',
    specular:
      'hover:border-[#EEF0F5] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:pointer-events-none',
    interactive:
      'cursor-pointer hover:border-cyan-500/30 hover:shadow-cyan-950/20 active:scale-[0.995]',
    accent:
      'border-cyan-500/20 bg-gradient-to-b from-[#0A1222] to-[#0A0E17] hover:border-cyan-500/40',
  }[variant];

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {(header || title || badge || action) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#EEF0F5]">
          {header ? (
            header
          ) : (
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#343B43]">
                  {title}
                </h3>
              )}
              {badge}
            </div>
          )}
          {action && <div className="flex items-center gap-1.5">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
