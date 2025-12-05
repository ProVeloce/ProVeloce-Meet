'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Clock, Video, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Routes matching the actual Next.js app structure
const navItems = [
  { label: 'Home', route: '/home', icon: Home },
  { label: 'Upcoming', route: '/upcoming', icon: Calendar },
  { label: 'Previous', route: '/previous', icon: Clock },
  { label: 'Recordings', route: '/recordings', icon: Video },
  { label: 'Personal Room', route: '/personal-room', icon: User },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="sticky left-0 top-16 flex h-[calc(100vh-4rem)] w-fit flex-col bg-white border-r border-border-lighter p-3 max-sm:hidden lg:w-[240px]"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.route ||
            (item.route !== '/home' && pathname.startsWith(`${item.route}/`));
          const Icon = item.icon;

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex gap-3 items-center px-3 py-2.5 rounded-full transition-colors',
                isActive
                  ? 'bg-google-blue-light text-google-blue font-medium'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm max-lg:hidden">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
