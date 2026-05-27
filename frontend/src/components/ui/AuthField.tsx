import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BaseFieldProps = {
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  containerClassName?: string;
};

type AuthInputFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type AuthTextAreaFieldProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

type AuthSelectFieldProps = BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: 'select';
    children: ReactNode;
  };

type AuthFieldProps = AuthInputFieldProps | AuthTextAreaFieldProps | AuthSelectFieldProps;

export default function AuthField(props: AuthFieldProps) {
  const { label, icon: Icon, containerClassName, className, as = 'input', ...rest } = props;
  const isSelect = as === 'select';
  const isTextArea = as === 'textarea';
  const hasLeadingIcon = Boolean(Icon) && !isSelect;

  const fieldClassName = cn(
    'w-full border border-slate-200 bg-slate-50 font-medium text-slate-900 outline-none transition-all',
    'focus:ring-2',
    isTextArea ? 'min-h-24 resize-none rounded-2xl px-4 py-4' : 'rounded-2xl py-4',
    isSelect ? 'appearance-none px-4' : hasLeadingIcon ? 'pl-12 pr-4' : 'px-4',
    className,
  );

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <label className="ml-1 text-sm font-bold text-slate-700">{label}</label>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        ) : null}

        {isTextArea ? (
          <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} className={fieldClassName} />
        ) : isSelect ? (
          <select {...(rest as SelectHTMLAttributes<HTMLSelectElement>)} className={fieldClassName}>
            {(props as AuthSelectFieldProps).children}
          </select>
        ) : (
          <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} className={fieldClassName} />
        )}
      </div>
    </div>
  );
}
