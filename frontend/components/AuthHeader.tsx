'use client';

import {
  SignInButton,
  SignUpButton,
  SignedOut,
} from '@clerk/nextjs';

const AuthHeader = () => {
  return (
    <header className="flex justify-end items-center p-4 gap-3 sm:gap-4 h-16">
      <SignedOut>
        <SignInButton mode="modal">
          <button 
            className="text-sm sm:text-base font-medium text-text-primary hover:text-google-blue transition-colors px-3 py-2 rounded-md hover:bg-light-2 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2"
            aria-label="Sign in to ProVeloce Meet"
          >
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button 
            className="bg-google-blue text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-11 px-5 sm:px-6 cursor-pointer hover:bg-google-blue-dark transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign up for ProVeloce Meet"
          >
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
    </header>
  );
};

export default AuthHeader;

