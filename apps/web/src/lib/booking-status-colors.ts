/** Locked Week 2 status → Tailwind classes (kickoff §2). */
export const BOOKING_STATUS_COLORS = {
  inquiry: "bg-yellow-100 text-yellow-800 border-yellow-300",
  pending_confirmation: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  checked_in: "bg-blue-100 text-blue-800 border-blue-300",
  checked_out: "bg-slate-100 text-slate-700 border-slate-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-red-100 text-red-700 border-red-300"
} as const;

export type BookingStatusKey = keyof typeof BOOKING_STATUS_COLORS;
