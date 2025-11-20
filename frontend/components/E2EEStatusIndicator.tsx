'use client';

import { Shield, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface E2EEStatusIndicatorProps {
  isActive: boolean;
  isInitializing?: boolean;
  error?: string;
  className?: string;
}

const E2EEStatusIndicator = ({
  isActive,
  isInitializing = false,
  error,
  className,
}: E2EEStatusIndicatorProps) => {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20', className)}
      >
        <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
        <span className="text-xs font-medium text-red-500">E2EE Failed</span>
      </motion.div>
    );
  }

  if (isInitializing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20', className)}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="h-4 w-4 text-yellow-500" />
        </motion.div>
        <span className="text-xs font-medium text-yellow-500">Securing...</span>
      </motion.div>
    );
  }

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20', className)}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldCheck className="h-4 w-4 text-green-500" />
        </motion.div>
        <span className="text-xs font-medium text-green-500">End-to-End Encrypted</span>
      </motion.div>
    );
  }

  return null;
};

export default E2EEStatusIndicator;

