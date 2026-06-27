import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  BULK_IMPORT_HEADERS,
  buildTemplateWorkbook,
  parseSpreadsheetToRows
} from "./bulk-import-spreadsheet";

describe("bulk-import-spreadsheet", () => {
  it("builds a workbook with the fixed template headers", () => {
    const buffer = buildTemplateWorkbook();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet!, {
      header: 1,
      defval: ""
    });
    expect(rows[0]).toEqual([...BULK_IMPORT_HEADERS]);
    expect(rows[1]?.[0]).toBe("Ada Okonkwo");
  });

  it("parses valid rows from xlsx with 1-based row numbers for data", () => {
    const wb = XLSX.utils.book_new();
    const data = [
      [...BULK_IMPORT_HEADERS],
      [
        "Ngozi Bello",
        "+2348012345678",
        "ngozi@example.com",
        "2026-03-01",
        "2026-03-03",
        "101",
        "inquiry"
      ]
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, sheet, "Import");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = parseSpreadsheetToRows(buffer);
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        rowNumber: 2,
        guestName: "Ngozi Bello",
        phone: "+2348012345678",
        unitNumber: "101",
        status: "inquiry"
      });
    }
  });

  it("rejects spreadsheets with wrong headers", () => {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["name", "phone", "email"],
      ["Ada", "+234", "a@b.com"]
    ]);
    XLSX.utils.book_append_sheet(wb, sheet, "Import");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const result = parseSpreadsheetToRows(buffer);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toMatch(/template/i);
    }
  });
});
