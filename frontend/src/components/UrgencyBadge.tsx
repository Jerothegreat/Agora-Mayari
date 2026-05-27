import { cn } from "@/lib/utils";

type UrgencyBadgeProps = {
  urgency: "low" | "medium" | "high";
};

const urgencyStyles = {
  low: {
    className: "bg-green-100 text-green-800",
    label: "Maaaring pangalagaan sa bahay",
  },
  medium: {
    className: "bg-yellow-100 text-yellow-800",
    label: "Kailangan ng konsultasyon",
  },
  high: {
    className: "bg-red-100 text-red-800 animate-pulse",
    label: "Pumunta sa ER agad",
  },
} as const;

export default function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const config = urgencyStyles[urgency];

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-2 text-xs font-black uppercase tracking-wider",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
