'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Shield, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { fadeInUp, fadeInLeft, fadeInRight } from '@/lib/animations';

const LandingIntro = () => {
  const router = useRouter();

  const features = [
    {
      icon: Video,
      title: 'Secure HD Video Calling',
      description: 'Crystal-clear video quality with enterprise-grade security',
    },
    {
      icon: Shield,
      title: 'Encrypted Meetings',
      description: 'End-to-end encryption with host controls for privacy',
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Screen sharing, chat, and seamless team collaboration',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gradient-to-br from-light-2 via-white to-light-2">
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* Logo and App Name */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div className="logo-gradient-wrapper">
            <Image
              src="/icons/logo.jpeg"
              alt="ProVeloce Meet Logo"
              width={64}
              height={64}
              className="logo-gradient h-14 w-14 sm:h-16 sm:w-16 rounded-lg"
            />
          </div>
          <h1 className="gradient-text text-5xl sm:text-6xl lg:text-7xl font-extrabold">
            ProVeloce Meet
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4 sm:mb-6"
        >
          Smart & seamless video meetings for teams and individuals
        </motion.p>

        {/* Description */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto space-y-3 mb-8 sm:mb-12"
        >
          <p className="text-lg sm:text-xl text-text-secondary leading-relaxed">
            Professional video conferencing platform designed for modern teams. Host secure online meetings with real-time collaboration, instant messaging, and meeting recording.
          </p>
          <p className="text-lg sm:text-xl text-text-secondary leading-relaxed">
            Start instant meetings, schedule sessions, or create personal rooms — all with enterprise-grade security and crystal-clear video quality.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial="hidden"
                animate="visible"
                variants={index === 0 ? fadeInLeft : index === 2 ? fadeInRight : fadeInUp}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white border border-light-4 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-google-blue/30"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-google-blue/10 rounded-lg">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-google-blue" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <button
            onClick={() => router.push('/sign-in')}
            className="w-full sm:w-auto min-w-[200px] bg-google-blue text-white rounded-full font-semibold text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 cursor-pointer hover:bg-google-blue-dark transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 flex items-center justify-center gap-2 group"
            aria-label="Sign in to ProVeloce Meet"
          >
            Login
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => router.push('/sign-up')}
            className="w-full sm:w-auto min-w-[200px] bg-white text-google-blue border-2 border-google-blue rounded-full font-semibold text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 cursor-pointer hover:bg-google-blue hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 flex items-center justify-center gap-2 group"
            aria-label="Sign up for ProVeloce Meet"
          >
            Signup
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Note */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.9 }}
          className="text-sm sm:text-base text-text-tertiary italic"
        >
          Login/Signup required to access dashboard & meeting features
        </motion.p>
      </div>
    </div>
  );
};

export default LandingIntro;

