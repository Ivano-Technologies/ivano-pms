import { countNights } from "./bookingOverlap";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const BULK_IMPORT_STATUSES = [
  "inquiry",
  "pending_confirmation",
  "confirmed"
] as const;

export type BulkImportStatus = (typeof BULK_IMPORT_STATUSES)[number];

export type BulkImportRawRow = {
  rowNumber: number;
  guestName: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  unitNumber: string;
  status: string;
};

export type ParsedBulkImportRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  checkInDate: string;
  checkOutDate: string;
  unitNumber: string;
  status: BulkImportStatus;
  idNumber: string;
};

type ParseSuccess = { ok: true; row: ParsedBulkImportRow };
type ParseFailure = { ok: false; reason: string };

export function splitGuestName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const space = trimmed.indexOf(" ");
  if (space === -1) {
    return { firstName: trimmed, lastName: "." };
  }
  return {
    firstName: trimmed.slice(0, space).trim(),
    lastName: trimmed.slice(space + 1).trim() || "."
  };
}

function parseIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) {
    return null;
  }
  const [y, m, d] = trimmed.split("-").map(Number);
  if (!y || !m || !d) {
    return null;
  }
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }
  return trimmed;
}

function parseStatus(value: string): BulkImportStatus | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (
    normalized === "inquiry" ||
    normalized === "pending_confirmation" ||
    normalized === "confirmed"
  ) {
    return normalized;
  }
  if (normalized === "pending" || normalized === "pending confirmation") {
    return "pending_confirmation";
  }
  return null;
}

export function parseBulkImportRow(
  raw: BulkImportRawRow
): ParseSuccess | ParseFailure {
  const { firstName, lastName } = splitGuestName(raw.guestName);
  if (!firstName) {
    return { ok: false, reason: "Guest name is required" };
  }

  const phone = raw.phone.trim();
  if (!phone) {
    return { ok: false, reason: "Phone is required" };
  }

  const checkInDate = parseIsoDate(raw.checkInDate);
  if (!checkInDate) {
    return {
      ok: false,
      reason: "Check-in must be a valid date (YYYY-MM-DD)"
    };
  }

  const checkOutDate = parseIsoDate(raw.checkOutDate);
  if (!checkOutDate) {
    return {
      ok: false,
      reason: "Check-out must be a valid date (YYYY-MM-DD)"
    };
  }

  if (checkOutDate <= checkInDate) {
    return { ok: false, reason: "Check-out must be after check-in" };
  }

  const unitNumber = raw.unitNumber.trim();
  if (!unitNumber) {
    return { ok: false, reason: "Unit number is required" };
  }

  const status = parseStatus(raw.status);
  if (!status) {
    return {
      ok: false,
      reason:
        "Status must be inquiry, pending_confirmation, or confirmed"
    };
  }

  const email = raw.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: "Email format is invalid" };
  }

  return {
    ok: true,
    row: {
      rowNumber: raw.rowNumber,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      checkInDate,
      checkOutDate,
      unitNumber,
      status,
      idNumber: `IMPORT-${raw.rowNumber}`
    }
  };
}

export function calcImportTotalPriceNgn(
  checkInDate: string,
  checkOutDate: string,
  pricePerNightNgn: number
): number {
  return countNights(checkInDate, checkOutDate) * pricePerNightNgn;
}
