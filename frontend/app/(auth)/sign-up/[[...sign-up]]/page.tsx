'use client';

import { SignUp } from '@clerk/nextjs';
import LandingSection from '@/components/LandingSection';

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex flex-col bg-white">
      {/* Landing Section - Always visible, no conditions */}
      <LandingSection />
      
      {/* Sign Up Form */}
      <div className="flex-shrink-0 flex items-center justify-center px-4 py-6 sm:py-8 bg-white">
        <div className="w-full max-w-md">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "shadow-lg border border-light-4 bg-white",
                headerTitle: "text-text-primary",
                headerSubtitle: "text-text-secondary",
              }
            }}
            routing="path"
            path="/sign-up"
          />
        </div>
      </div>
    </main>
  );
}
