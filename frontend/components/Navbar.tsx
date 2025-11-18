import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';

import MobileNav from './MobileNav';
import Clock from './Clock';

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1/95 backdrop-blur-md border-b border-dark-3 px-6 py-4 lg:px-10 card-shadow">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/icons/logo.svg"
          width={32}
          height={32}
          alt="ProVeloce Meet logo"
          className="max-sm:size-10"
        />
        <p className="text-[26px] font-extrabold text-white max-sm:hidden">
          ProVeloce Meet
        </p>
      </Link>
      <div className="flex-between gap-5">
        <div className="hidden md:flex items-center">
          <Clock />
        </div>
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>

        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
