import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

type DashboardMetricCardProps = {
  label: string;
  value: string | number;
  accentClassName?: string;
  cardClassName?: string;
  valueClassName?: string;
  suffix?: string;
  icon?: ReactElement;
  iconWrapperClassName?: string;
};

export default function DashboardMetricCard({
  label,
  value,
  accentClassName = 'text-slate-400',
  cardClassName,
  valueClassName,
  suffix,
  icon,
  iconWrapperClassName,
}: DashboardMetricCardProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white p-4 shadow-sm', cardClassName)}>
      {icon ? <div className={cn('mb-3 w-fit rounded-2xl p-3', iconWrapperClassName)}>{icon}</div> : null}
      <div>
        <p className={cn('text-[10px] font-black uppercase tracking-widest', accentClassName)}>{label}</p>
        <p className={cn('mt-1 text-2xl font-black text-slate-900', valueClassName)}>
          {value}
          {suffix ? <span className="text-sm font-bold text-slate-400">{suffix}</span> : null}
        </p>
      </div>
    </div>
  );
}
