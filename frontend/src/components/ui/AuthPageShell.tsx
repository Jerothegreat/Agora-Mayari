'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AuthPageShellProps = {
  children: ReactNode;
  cardClassName?: string;
  backgroundClassName?: string;
  variant?: 'teal' | 'blue';
  motionProps?: HTMLMotionProps<'div'>;
};

const backgroundVariants = {
  teal: [
    'absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-100/50 blur-[120px] rounded-full',
    'absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full',
  ],
  blue: [
    'absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/50 blur-[120px] rounded-full',
    'absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-100/50 blur-[120px] rounded-full',
  ],
};

export default function AuthPageShell({
  children,
  cardClassName,
  backgroundClassName,
  variant = 'teal',
  motionProps,
}: AuthPageShellProps) {
  const [primaryBg, secondaryBg] = backgroundVariants[variant];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className={cn('absolute inset-0 -z-10 overflow-hidden', backgroundClassName)}>
        <div className={primaryBg} />
        <div className={secondaryBg} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full max-w-md rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-2xl shadow-slate-200',
          cardClassName,
        )}
        {...motionProps}
      >
        {children}
      </motion.div>
    </main>
  );
}
