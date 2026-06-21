export type UnitTypeHint = "room" | "suite" | "villa" | "studio";

export type MessageKeywordExtraction = {
  extractedCheckIn?: string;
  extractedCheckOut?: string;
  extractedGuestNames?: string[];
  extractedUnitType?: UnitTypeHint;
};

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12
};

const UNIT_TYPES: UnitTypeHint[] = ["villa", "suite", "studio", "room"];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseReferenceParts(referenceDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = referenceDate.split("-").map(Number);
  return {
    year: year ?? 2026,
    month: month ?? 1,
    day: day ?? 1
  };
}

function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )!;
}

function inferYear(month: number, referenceDate: string): number {
  const ref = parseReferenceParts(referenceDate);
  if (month < ref.month) {
    return ref.year + 1;
  }
  return ref.year;
}

function parseMonthDay(
  monthName: string,
  day: number,
  referenceDate: string
): string | undefined {
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) {
    return undefined;
  }
  return toIsoDate(inferYear(month, referenceDate), month, day);
}

function nextWeekendStart(referenceDate: string): string {
  const ref = parseReferenceParts(referenceDate);
  const date = new Date(Date.UTC(ref.year, ref.month - 1, ref.day));
  const dayOfWeek = date.getUTCDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilSaturday);
  return toIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )!;
}

function extractUnitType(text: string): UnitTypeHint | undefined {
  const lower = text.toLowerCase();
  for (const unitType of UNIT_TYPES) {
    if (lower.includes(unitType)) {
      return unitType;
    }
  }
  return undefined;
}

function extractGuestNames(messageText: string): string[] | undefined {
  const names = new Set<string>();

  const forMatches = messageText.matchAll(
    /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
  );
  for (const match of forMatches) {
    const name = match[1]?.trim();
    if (name) {
      names.add(name);
    }
  }

  const villaFor = messageText.match(
    /\b(?:villa|suite|room|studio)\s+for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  );
  if (villaFor?.[1]) {
    names.add(villaFor[1].trim());
  }

  return names.size > 0 ? [...names] : undefined;
}

function extractDates(
  messageText: string,
  referenceDate: string
): Pick<MessageKeywordExtraction, "extractedCheckIn" | "extractedCheckOut"> {
  const text = messageText;

  const rangeMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})\b/i
  );
  if (rangeMatch) {
    const checkIn = parseMonthDay(rangeMatch[1]!, Number(rangeMatch[2]), referenceDate);
    const checkOut = parseMonthDay(
      rangeMatch[1]!,
      Number(rangeMatch[3]),
      referenceDate
    );
    if (checkIn && checkOut) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: checkOut
      };
    }
  }

  const toRangeMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\s+to\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b/i
  );
  if (toRangeMatch) {
    const checkIn = parseMonthDay(toRangeMatch[1]!, Number(toRangeMatch[2]), referenceDate);
    const checkOut = parseMonthDay(
      toRangeMatch[3]!,
      Number(toRangeMatch[4]),
      referenceDate
    );
    if (checkIn && checkOut) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: checkOut
      };
    }
  }

  const onNightsMatch = text.match(
    /\bon\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2}),?\s+(\d+)\s+nights?\b/i
  );
  if (onNightsMatch) {
    const checkIn = parseMonthDay(
      onNightsMatch[1]!,
      Number(onNightsMatch[2]),
      referenceDate
    );
    const nights = Number(onNightsMatch[3]);
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const nightsMatch = text.match(
    /\b(\d+)\s+nights?\s+from\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b/i
  );
  if (nightsMatch) {
    const nights = Number(nightsMatch[1]);
    const checkIn = parseMonthDay(nightsMatch[2]!, Number(nightsMatch[3]), referenceDate);
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const fromNightsMatch = text.match(
    /\bfrom\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\s+for\s+(\d+)\s+nights?\b/i
  );
  if (fromNightsMatch) {
    const nights = Number(fromNightsMatch[3]);
    const checkIn = parseMonthDay(
      fromNightsMatch[1]!,
      Number(fromNightsMatch[2]),
      referenceDate
    );
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const startingMatch = text.match(
    /\bstarting\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b/i
  );
  const nightsAfter = text.match(/\bfor\s+(\d+)\s+nights?\b/i);
  if (startingMatch && nightsAfter) {
    const checkIn = parseMonthDay(
      startingMatch[1]!,
      Number(startingMatch[2]),
      referenceDate
    );
    const nights = Number(nightsAfter[1]);
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const weekMatch = text.match(
    /\bfrom\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\s+for\s+one\s+week\b/i
  );
  if (weekMatch) {
    const checkIn = parseMonthDay(weekMatch[1]!, Number(weekMatch[2]), referenceDate);
    if (checkIn) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, 7)
      };
    }
  }

  if (/\bnext\s+weekend\b/i.test(text)) {
    const checkIn = nextWeekendStart(referenceDate);
    return {
      extractedCheckIn: checkIn,
      extractedCheckOut: addDaysIso(checkIn, 2)
    };
  }

  const onDateMatch = text.match(
    /\bon\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:,|\s+)(\d+)\s+nights?\b/i
  );
  if (onDateMatch) {
    const checkIn = parseMonthDay(onDateMatch[1]!, Number(onDateMatch[2]), referenceDate);
    const nights = Number(onDateMatch[3]);
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const singleNightMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b[^.]*\bfor\s+(\d+)\s+nights?\b/i
  );
  if (singleNightMatch) {
    const checkIn = parseMonthDay(
      singleNightMatch[1]!,
      Number(singleNightMatch[2]),
      referenceDate
    );
    const nights = Number(singleNightMatch[3]);
    if (checkIn && nights > 0) {
      return {
        extractedCheckIn: checkIn,
        extractedCheckOut: addDaysIso(checkIn, nights)
      };
    }
  }

  const singleDateMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b/i
  );
  if (singleDateMatch) {
    const checkIn = parseMonthDay(
      singleDateMatch[1]!,
      Number(singleDateMatch[2]),
      referenceDate
    );
    if (checkIn) {
      return { extractedCheckIn: checkIn };
    }
  }

  return {};
}

/** Regex/heuristic extraction for channel message text (MVP — no LLM). */
export function extractMessageKeywords(
  messageText: string,
  referenceDate: string
): MessageKeywordExtraction {
  const trimmed = messageText.trim();
  if (!trimmed) {
    return {};
  }

  const dates = extractDates(trimmed, referenceDate);
  const extractedUnitType = extractUnitType(trimmed);
  const extractedGuestNames = extractGuestNames(trimmed);

  return {
    ...dates,
    ...(extractedUnitType ? { extractedUnitType } : {}),
    ...(extractedGuestNames ? { extractedGuestNames } : {})
  };
}

export function referenceDateFromTimestamp(now: number): string {
  const date = new Date(now);
  return toIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )!;
}

export function formatExtractionBadge(
  extraction: MessageKeywordExtraction
): string | undefined {
  if (extraction.extractedCheckIn && extraction.extractedCheckOut) {
    const checkIn = extraction.extractedCheckIn.slice(5).replace("-", "/");
    const checkOut = extraction.extractedCheckOut.slice(5).replace("-", "/");
    return `${checkIn}–${checkOut}`;
  }
  if (extraction.extractedCheckIn) {
    return extraction.extractedCheckIn.slice(5).replace("-", "/");
  }
  return undefined;
}
