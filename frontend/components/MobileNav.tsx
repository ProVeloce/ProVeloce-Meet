'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import Clock from './Clock';

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-text-primary hover:bg-light-2 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 transition-colors sm:hidden"
            aria-label="Open navigation menu"
            aria-expanded="false"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="border-r border-light-4 bg-white w-[280px] sm:w-[300px]"
        >
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-light-4">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 rounded-md"
              onClick={() => document.dispatchEvent(new CustomEvent('sheet-close'))}
            >
              <div className="logo-gradient-wrapper relative">
                <Image
                  src="/icons/logo.svg"
                  width={32}
                  height={32}
                  alt="ProVeloce Meet logo"
                  className="w-8 h-8 logo-gradient"
                />
              </div>
              <p className="text-xl font-bold gradient-text">ProVeloce Meet</p>
            </Link>
            <div className="sm:hidden">
              <Clock />
            </div>
          </div>
          <div className="flex h-[calc(100vh-120px)] flex-col justify-between overflow-y-auto">
            <SheetClose asChild>
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {sidebarLinks.map((item) => {
                  const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

                  return (
                    <SheetClose asChild key={item.route}>
                      <Link
                        href={item.route}
                        className={cn(
                          'flex gap-3 items-center px-4 py-3 rounded-lg w-full transition-all duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2',
                          {
                            'bg-google-blue text-white shadow-sm': isActive,
                            'text-text-secondary hover:bg-light-2 hover:text-text-primary': !isActive,
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
                        <span className={cn('font-medium text-base transition-colors', {
                          'text-white': isActive,
                          'text-text-primary': !isActive,
                        })}>{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
