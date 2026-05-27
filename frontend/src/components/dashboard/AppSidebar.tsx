import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SidebarNavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
};

type SidebarStat = {
  label: string;
  value: string | number;
  valueClassName?: string;
};

type AppSidebarProps = {
  brandIcon: ReactNode;
  brandLabel: string;
  profileInitial: string;
  profileName?: string;
  profileRole: string;
  profileAccentClassName: string;
  profileInitialClassName: string;
  stats: SidebarStat[];
  navItems: SidebarNavItem[];
  footerAction: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    className?: string;
  };
};

export default function AppSidebar({
  brandIcon,
  brandLabel,
  profileInitial,
  profileName,
  profileRole,
  profileAccentClassName,
  profileInitialClassName,
  stats,
  navItems,
  footerAction,
}: AppSidebarProps) {
  const FooterIcon = footerAction.icon;

  return (
    <aside className="hidden w-72 flex-col gap-8 border-r border-slate-100 bg-white p-8 lg:flex">
      <div className="flex items-center gap-2">
        {brandIcon}
        <span className="text-xl font-black tracking-tighter text-slate-800">{brandLabel}</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black', profileInitialClassName)}>
          {profileInitial}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{profileName}</p>
          <p className="text-[11px] font-medium text-slate-400">{profileRole}</p>
        </div>
        <div
          className={cn(
            'grid gap-2 border-t border-slate-200 pt-2',
            stats.length === 3 ? 'grid-cols-3' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-4',
          )}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={cn('text-lg font-black', stat.valueClassName, profileAccentClassName)}>{stat.value}</p>
              <p className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const className = cn(
            'flex items-center gap-3 rounded-2xl p-4 font-bold transition-all',
            item.active ? profileAccentClassName : 'text-slate-500 hover:bg-slate-50',
            item.active && 'bg-current/10',
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                <Icon size={20} />
                {item.label}
              </Link>
            );
          }

          return (
            <button key={item.label} type="button" onClick={item.onClick} className={cn('w-full', className)}>
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button type="button" onClick={footerAction.onClick} className={cn('flex items-center gap-3 rounded-2xl p-4 font-bold transition-all', footerAction.className)}>
        <FooterIcon size={20} />
        {footerAction.label}
      </button>
    </aside>
  );
}
