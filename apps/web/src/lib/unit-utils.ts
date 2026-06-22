export type UnitTypeValue = "room" | "suite" | "villa" | "studio";
export type AvailabilityStatus = "available" | "occupied" | "maintenance" | "reserved";

export type UnitFormValues = {
  unitNumber: string;
  unitType: UnitTypeValue;
  capacityGuests: number;
  pricePerNightNgn: number;
  amenities: string[];
};

export type UnitFormErrors = Partial<Record<keyof UnitFormValues, string>>;

export const UNIT_TYPE_OPTIONS: { value: UnitTypeValue; label: string }[] = [
  { value: "room", label: "Room" },
  { value: "suite", label: "Suite" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" }
];

export const AMENITY_OPTIONS = [
  "WiFi",
  "AC",
  "TV",
  "Pool",
  "Kitchen",
  "Parking",
  "Balcony",
  "Hot water",
  "Generator"
];

export const AVAILABILITY_STATUS_META: Record<
  AvailabilityStatus,
  { label: string; badgeClass: string }
> = {
  available: {
    label: "Available",
    badgeClass:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
  },
  occupied: {
    label: "Occupied",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
  },
  maintenance: {
    label: "Maintenance",
    badgeClass:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
  },
  reserved: {
    label: "Reserved",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
  }
};

export function emptyUnitForm(): UnitFormValues {
  return {
    unitNumber: "",
    unitType: "room",
    capacityGuests: 2,
    pricePerNightNgn: 25000,
    amenities: []
  };
}

export function unitFormFromDoc(unit: {
  unitNumber: string;
  unitType: UnitTypeValue;
  capacityGuests: number;
  pricePerNightNgn: number;
  amenities: string[];
}): UnitFormValues {
  return {
    unitNumber: unit.unitNumber,
    unitType: unit.unitType,
    capacityGuests: unit.capacityGuests,
    pricePerNightNgn: unit.pricePerNightNgn,
    amenities: [...unit.amenities]
  };
}

export function validateUnitForm(values: UnitFormValues): UnitFormErrors {
  const errors: UnitFormErrors = {};
  if (!values.unitNumber.trim()) {
    errors.unitNumber = "Unit number is required";
  } else if (values.unitNumber.trim().length > 50) {
    errors.unitNumber = "Max 50 characters";
  }
  if (values.capacityGuests < 1 || values.capacityGuests > 20) {
    errors.capacityGuests = "Capacity must be 1–20";
  }
  if (values.pricePerNightNgn < 0) {
    errors.pricePerNightNgn = "Price cannot be negative";
  }
  return errors;
}

export function toUnitMutationArgs(values: UnitFormValues) {
  return {
    unitNumber: values.unitNumber.trim(),
    unitType: values.unitType,
    capacityGuests: values.capacityGuests,
    pricePerNightNgn: values.pricePerNightNgn,
    amenities: values.amenities
  };
}

const ngnFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function formatNgn(amount: number): string {
  return ngnFormatter.format(amount);
}

export function getOccupancyPercentage(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

export const inputClassName =
  "border-input bg-background w-full rounded-lg border px-3 py-2 text-sm";
