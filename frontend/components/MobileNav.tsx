'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, Calendar, Clock, Video, History, User, X } from 'lucide-react';
import { useState, useCallback, memo } from 'react';

import { cn } from '@/lib/utils';

// Navigation items with icons
const navItems = [
  { label: 'Home', route: '/home', Icon: Home },
  { label: 'Upcoming', route: '/upcoming', Icon: Calendar },
  { label: 'Previous', route: '/previous', Icon: Clock },
  { label: 'Recordings', route: '/recordings', Icon: Video },
  { label: 'History', route: '/history', Icon: History },
  { label: 'Personal Room', route: '/personal-room', Icon: User },
];

const MobileNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center rounded-full p-2 text-text-primary hover:bg-bg-tertiary transition-colors sm:hidden touch-target"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] sm:hidden animate-fadeIn"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-[280px] bg-white z-[70] sm:hidden transition-transform duration-300 ease-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-lighter safe-top">
          <Link
            href="/home"
            className="flex items-center gap-2"
            onClick={closeMenu}
          >
            <Image
              src="/icons/logo.jpeg"
              width={32}
              height={32}
              alt="ProVeloce Meet"
              className="w-8 h-8 rounded"
            />
            <span className="text-lg font-semibold text-text-primary">ProVeloce Meet</span>
          </Link>

          <button
            onClick={closeMenu}
            className="p-2 rounded-full hover:bg-bg-tertiary transition-colors touch-target"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-70px)]" aria-label="Mobile navigation">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.route ||
                (item.route !== '/home' && pathname.startsWith(`${item.route}/`));
              const Icon = item.Icon;

              return (
                <li key={item.route}>
                  <Link
                    href={item.route}
                    onClick={closeMenu}
                    className={cn(
                      'flex gap-3 items-center px-4 py-3 rounded-full w-full transition-colors touch-target',
                      isActive
                        ? 'bg-google-blue-light text-google-blue font-medium'
                        : 'text-text-secondary hover:bg-bg-tertiary active:bg-bg-hover'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default memo(MobileNav);
