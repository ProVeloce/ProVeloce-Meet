'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

import MobileNav from './MobileNav';
import Clock from './Clock';

const Navbar = () => {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-light-4 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 rounded-md"
          aria-label="ProVeloce Meet Home"
        >
          <div className="logo-gradient-wrapper relative">
            <Image
              src="/icons/logo.svg"
              width={32}
              height={32}
              alt="ProVeloce Meet logo"
              className="w-8 h-8 sm:w-9 sm:h-9 logo-gradient"
              priority
            />
          </div>
          <p className="text-xl sm:text-2xl font-bold gradient-text max-sm:hidden">
            ProVeloce Meet
          </p>
        </Link>

        {/* Right side items */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Clock - Desktop only */}
          <div className="hidden lg:flex items-center">
            <Clock />
          </div>

          {/* User Button - Only show when signed in */}
          <SignedIn>
            <div className="flex items-center">
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 sm:w-10 sm:h-10",
                    userButtonPopoverCard: "shadow-lg border border-light-4 bg-white",
                    userButtonPopoverActionButton: "text-black hover:bg-light-2 profile-menu-item",
                    userButtonPopoverActionButtonText: "text-black profile-menu-text",
                    userButtonPopoverFooter: "hidden",
                  },
                  variables: {
                    colorText: "#000000",
                    colorPrimary: "#1A73E8",
                    colorBackground: "#FFFFFF",
                  }
                }}
              />
            </div>
          </SignedIn>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
