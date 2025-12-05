'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';

interface HomeCardProps {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  handleClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const HomeCard = memo(function HomeCard({
  className,
  icon,
  title,
  description,
  handleClick,
  variant = 'secondary'
}: HomeCardProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-xl text-left transition-all touch-target no-select",
        "active:scale-[0.98]",
        variant === 'primary'
          ? "bg-google-blue text-white hover:bg-google-blue-hover shadow-md"
          : "bg-white border border-border-lighter hover:bg-bg-tertiary hover:shadow-sm text-text-primary",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0",
        variant === 'primary' ? "bg-white/20" : "bg-bg-tertiary"
      )}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
        {description && (
          <p className={cn(
            "text-xs sm:text-sm mt-0.5 truncate",
            variant === 'primary' ? "text-white/70" : "text-text-secondary"
          )}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
});

export default HomeCard;
