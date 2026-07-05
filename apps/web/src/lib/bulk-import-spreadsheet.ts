import * as XLSX from "xlsx";

export const BULK_IMPORT_HEADERS = [
  "guest_name",
  "phone",
  "email",
  "check_in",
  "check_out",
  "unit_number",
  "status"
] as const;

export type BulkImportClientRow = {
  rowNumber: number;
  guestName: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  unitNumber: string;
  status: string;
};

const EXAMPLE_ROW = [
  "Ada Okonkwo",
  "+2348012345678",
  "ada@example.com",
  "2026-03-01",
  "2026-03-03",
  "101",
  "inquiry"
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function cellString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).trim();
}

export function buildTemplateWorkbook(): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    [...BULK_IMPORT_HEADERS],
    EXAMPLE_ROW
  ]);
  XLSX.utils.book_append_sheet(wb, sheet, "Import");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadImportTemplate(filename = "ivano-booking-import-template.xlsx") {
  const buffer = buildTemplateWorkbook();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseSpreadsheetToRows(
  buffer: ArrayBuffer
): { rows: BulkImportClientRow[] } | { error: string } {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { error: "The file has no worksheets" };
  }

  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    return { error: "Could not read the worksheet" };
  }

  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false
  });

  if (table.length < 2) {
    return { error: "The file must include a header row and at least one data row" };
  }

  const headerRow = table[0] ?? [];
  const normalized = headerRow.map(normalizeHeader);
  const expected = BULK_IMPORT_HEADERS.map((h) => h.toLowerCase());

  const headersMatch =
    normalized.length >= expected.length &&
    expected.every((header, index) => normalized[index] === header);

  if (!headersMatch) {
    return {
      error:
        "Column headers do not match the template. Download the template and use columns: guest_name, phone, email, check_in, check_out, unit_number, status"
    };
  }

  const rows: BulkImportClientRow[] = [];

  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i] ?? [];
    const guestName = cellString(cells[0]);
    const phone = cellString(cells[1]);
    const email = cellString(cells[2]);
    const checkInDate = cellString(cells[3]);
    const checkOutDate = cellString(cells[4]);
    const unitNumber = cellString(cells[5]);
    const status = cellString(cells[6]);

    const isBlank =
      !guestName &&
      !phone &&
      !email &&
      !checkInDate &&
      !checkOutDate &&
      !unitNumber &&
      !status;

    if (isBlank) {
      continue;
    }

    rows.push({
      rowNumber: i + 1,
      guestName,
      phone,
      email,
      checkInDate,
      checkOutDate,
      unitNumber,
      status
    });
  }

  if (rows.length === 0) {
    return { error: "No data rows found below the header" };
  }

  return { rows };
}
