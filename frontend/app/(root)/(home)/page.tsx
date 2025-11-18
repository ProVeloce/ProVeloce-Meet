'use client';

import { useEffect, useState } from 'react';
import MeetingTypeList from '@/components/MeetingTypeList';
import DashboardClock from '@/components/DashboardClock';
import UpcomingMeeting from '@/components/UpcomingMeeting';

const Home = () => {
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setDate(new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now));
    };

    updateDate();
    // Update date at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    
    let intervalId: NodeJS.Timeout | null = null;
    
    const timeoutId = setTimeout(() => {
      updateDate();
      intervalId = setInterval(updateDate, 86400000); // 24 hours
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <div>
            <UpcomingMeeting />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl tabular-nums text-white">
              <DashboardClock className="text-white" />
            </h1>
            <p className="text-lg font-medium text-sky-1 lg:text-2xl">{date}</p>
          </div>
        </div>
      </div>

      <MeetingTypeList />
    </section>
  );
};

export default Home;
