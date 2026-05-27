import { cn } from '@/lib/utils';

type DashboardTabsProps<T extends string> = {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  activeClassName?: string;
  inactiveClassName?: string;
  className?: string;
};

export default function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  activeClassName,
  inactiveClassName,
  className,
}: DashboardTabsProps<T>) {
  return (
    <div className={cn('flex w-fit rounded-2xl border border-slate-200 bg-slate-200/50 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-xl px-5 py-2 text-sm font-bold capitalize transition-all',
            activeTab === tab ? cn('bg-white shadow-sm', activeClassName) : cn('text-slate-500 hover:text-slate-700', inactiveClassName),
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
