'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import MeetingTypeList from '@/components/MeetingTypeList';

const Home = () => {
    const { user } = useUser();
    const [currentTime, setCurrentTime] = useState<string>('');
    const [currentDate, setCurrentDate] = useState<string>('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }));
            setCurrentDate(now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            }));
        };

        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <section className="flex size-full flex-col gap-8 text-text-primary">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl md:text-3xl font-normal text-text-primary mb-1">
                    {greeting()}{user?.firstName ? `, ${user.firstName}` : ''}
                </h1>
                <p className="text-text-secondary text-sm">
                    {currentTime} · {currentDate}
                </p>
            </div>

            {/* Quick Actions */}
            <div className="max-w-4xl">
                <MeetingTypeList />
            </div>
        </section>
    );
};

export default Home;
