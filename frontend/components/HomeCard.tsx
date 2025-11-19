'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface HomeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const HomeCard = ({ className, img, title, description, handleClick }: HomeCardProps) => {
  return (
    <section
      className={cn(
        'px-5 py-6 flex flex-col justify-between w-full xl:max-w-[270px] min-h-[260px] rounded-xl cursor-pointer',
        'transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-google-blue focus-within:ring-offset-2',
        'bg-white border border-light-4 shadow-sm',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick?.();
        }
      }}
      aria-label={`${title}: ${description}`}
    >
      <div className="flex-center bg-light-2 size-12 rounded-lg mb-4">
        <Image src={img} alt="" width={24} height={24} className="icon-blue" aria-hidden="true" />
      </div>
      
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <p className="text-base font-normal text-text-secondary leading-relaxed">{description}</p>
      </div>
    </section>
  );
};

export default HomeCard;
