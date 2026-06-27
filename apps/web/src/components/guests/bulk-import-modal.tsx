"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getConvexUserMessage } from "@/lib/convex-error";
import {
  downloadImportTemplate,
  parseSpreadsheetToRows
} from "@/lib/bulk-import-spreadsheet";

import { api } from "../../../../../convex/_generated/api";

type BulkImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ImportSummary = {
  importedCount: number;
  skipped: Array<{ rowNumber: number; reason: string }>;
};

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const bulkImport = useMutation(api.functions.bulkImport.bulkImportBookings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    if (isUploading) {
      return;
    }
    setSummary(null);
    onClose();
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSpreadsheetToRows(buffer);
      if ("error" in parsed) {
        toast.error(parsed.error);
        return;
      }

      const result = await bulkImport({ rows: parsed.rows });
      setSummary({
        importedCount: result.importedCount,
        skipped: result.skipped
      });

      if (result.importedCount > 0 && result.skipped.length === 0) {
        toast.success(`${result.importedCount} booking(s) imported`);
      } else if (result.importedCount > 0) {
        toast.success(
          `${result.importedCount} imported, ${result.skipped.length} skipped`
        );
      } else {
        toast.error("No rows imported — review the summary below");
      }
    } catch (error) {
      toast.error(getConvexUserMessage(error, "Import failed"));
    } finally {
      setIsUploading(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
    >
      <div className="bg-background border-border w-full max-w-lg rounded-xl border p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="bulk-import-title" className="text-lg font-semibold">
              Import bookings
            </h2>
            <p className="text-muted-foreground text-sm">
              Upload the fixed template (.xlsx or .csv). Valid rows import;
              invalid rows are skipped with reasons.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
          >
            Close
          </Button>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => downloadImportTemplate()}
          >
            Download template
          </Button>

          <label className="border-border flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
            <span className="text-sm font-medium">
              {isUploading ? "Importing…" : "Choose spreadsheet"}
            </span>
            <span className="text-muted-foreground mt-1 text-xs">
              .xlsx or .csv — columns must match the template
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
          </label>

          {summary ? (
            <div
              className="border-border bg-muted/30 rounded-lg border p-4 text-sm"
              aria-live="polite"
            >
              <p className="font-medium">
                {summary.importedCount} imported
                {summary.skipped.length > 0
                  ? `, ${summary.skipped.length} skipped`
                  : ""}
              </p>
              {summary.skipped.length > 0 ? (
                <ul className="text-muted-foreground mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {summary.skipped.map((row) => (
                    <li key={row.rowNumber}>
                      Row {row.rowNumber}: {row.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
