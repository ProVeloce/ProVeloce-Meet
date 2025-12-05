'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  handleClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const HomeCard = ({
  className,
  icon,
  title,
  description,
  handleClick,
  variant = 'secondary'
}: HomeCardProps) => {
  return (
    <button
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-lg text-left transition-colors",
        variant === 'primary'
          ? "bg-google-blue text-white hover:bg-google-blue-hover"
          : "bg-white border border-border-lighter hover:bg-bg-tertiary text-text-primary",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        variant === 'primary' ? "bg-white/20" : "bg-bg-tertiary"
      )}>
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-base">{title}</h3>
        {description && (
          <p className={cn(
            "text-sm mt-0.5",
            variant === 'primary' ? "text-white/70" : "text-text-secondary"
          )}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
};

export default HomeCard;
