'use client';

import { useState } from 'react';
import { SignedOut } from '@clerk/nextjs';
import AuthModal from './AuthModal';

const AuthHeader = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <>
      <header className="flex justify-end items-center p-4 gap-3 sm:gap-4 h-16">
        <SignedOut>
          <button
            onClick={() => {
              setAuthMode('sign-in');
              setIsAuthModalOpen(true);
            }}
            className="text-sm sm:text-base font-medium text-text-primary hover:text-google-blue transition-colors px-3 py-2 rounded-md hover:bg-light-2 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2"
            aria-label="Sign in to ProVeloce Meet"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('sign-up');
              setIsAuthModalOpen(true);
            }}
            className="bg-google-blue text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-11 px-5 sm:px-6 cursor-pointer hover:bg-google-blue-dark transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign up for ProVeloce Meet"
          >
            Sign Up
          </button>
        </SignedOut>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default AuthHeader;

