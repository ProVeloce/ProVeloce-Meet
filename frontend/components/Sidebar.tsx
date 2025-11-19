'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside 
      className="sticky left-0 top-16 flex h-[calc(100vh-4rem)] w-fit flex-col justify-between bg-white border-r border-light-4 p-4 pt-6 text-text-primary max-sm:hidden lg:w-[240px]"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <nav className="flex flex-1 flex-col gap-2" aria-label="Main navigation">
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);
          
          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex gap-3 items-center px-4 py-3 rounded-lg justify-start transition-all duration-200',
                'hover:bg-light-2 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2',
                {
                  'bg-google-blue text-white shadow-sm': isActive,
                  'text-text-secondary hover:text-text-primary': !isActive,
                }
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Image
                src={item.imgURL}
                alt=""
                width={20}
                height={20}
                className={cn('transition-all duration-200', {
                  'icon-white': isActive,
                  'icon-blue': !isActive,
                })}
                aria-hidden="true"
              />
              <span className={cn('text-base font-medium max-lg:hidden transition-colors', {
                'text-white': isActive,
                'text-text-primary': !isActive,
              })}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
