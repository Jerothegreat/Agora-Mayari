import Link from "next/link";
import { CalendarCheck2, ChevronRight } from "lucide-react";

type BookingConfirmationCardProps = {
  appointmentId: string | null;
};

export default function BookingConfirmationCard({
  appointmentId,
}: BookingConfirmationCardProps) {
  return (
    <div className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-teal-600 p-3 text-white">
          <CalendarCheck2 size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">
            Booking Confirmation
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
            {appointmentId ? "May pending booking na si Mayari" : "Handa nang mag-book"}
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            {appointmentId
              ? `Naipasa na ang intake at ginawa ang pending appointment record (${appointmentId.slice(0, 8)}...).`
              : "I-review ang intake at kumpletuhin ang booking sa patient dashboard."}
          </p>
          <Link
            href="/dashboard/patient?book=true"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-700"
          >
            Buksan ang booking
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
