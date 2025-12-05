'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import MeetingTypeList from '@/components/MeetingTypeList';
import DashboardClock from '@/components/DashboardClock';
import UpcomingMeeting from '@/components/UpcomingMeeting';

const HomePage = () => {
    const { user } = useUser();
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        const updateDate = () => {
            const now = new Date();
            setDate(new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(now));
        };

        updateDate();
        const now = new Date();
        const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

        let intervalId: NodeJS.Timeout | null = null;

        const timeoutId = setTimeout(() => {
            updateDate();
            intervalId = setInterval(updateDate, 86400000);
        }, msUntilMidnight);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    return (
        <section className="flex size-full flex-col gap-6 text-text-primary" role="main" aria-label="Home dashboard">
            {/* Hero Banner */}
            <div className="h-[280px] sm:h-[320px] w-full rounded-xl bg-gradient-to-br from-google-blue to-blue-1 shadow-lg overflow-hidden" role="banner" aria-label="Hero section">
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 lg:p-11">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tabular-nums text-white drop-shadow-sm" aria-live="polite">
                            <DashboardClock className="text-white" />
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl font-medium text-white/95" aria-label={`Current date: ${date}`}>
                            {date}
                        </p>
                        <UpcomingMeeting />
                    </div>
                </div>
            </div>

            {/* Meeting Actions */}
            <MeetingTypeList />
        </section>
    );
};

export default HomePage;
