import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  panelClassName?: string;
  closeOnOverlayClick?: boolean;
};

export default function DashboardModal({
  open,
  onClose,
  title,
  children,
  panelClassName,
  closeOnOverlayClick = true,
}: DashboardModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-6 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-8 shadow-2xl',
              panelClassName,
            )}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-slate-900">{title}</h3>
              <button type="button" onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
