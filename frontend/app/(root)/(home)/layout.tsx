import { Metadata } from 'next';
import { ReactNode } from 'react';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ProVeloce Meet',
  description: 'A workspace for your team, powered by Stream Chat and Clerk.',
};

const RootLayout = ({ children }: Readonly<{children: ReactNode}>) => {
  return (
    <main className="relative min-h-screen bg-light-2">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />
        
        <section className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col px-4 sm:px-6 lg:px-8 pb-6 pt-6 max-md:pb-14">
          <div className="w-full max-w-7xl mx-auto">{children}</div>
        </section>
      </div>
    </main>
  );
};

export default RootLayout;
