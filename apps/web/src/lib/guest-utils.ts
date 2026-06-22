export type GuestIdType =
  | "passport"
  | "drivers_license"
  | "national_id"
  | "other";

export type GuestFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  whatsapp: string;
  idType: GuestIdType;
  idNumber: string;
  notes: string;
};

export const ID_TYPE_OPTIONS: { value: GuestIdType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's license" },
  { value: "national_id", label: "National ID" },
  { value: "other", label: "Other" }
];

export function formatGuestName(guest: {
  firstName: string;
  lastName: string;
}): string {
  return `${guest.firstName} ${guest.lastName}`.trim();
}

export function formatIdType(idType: GuestIdType): string {
  return ID_TYPE_OPTIONS.find((o) => o.value === idType)?.label ?? idType;
}

export function emptyGuestForm(): GuestFormValues {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    whatsapp: "",
    idType: "passport",
    idNumber: "",
    notes: ""
  };
}

export type GuestFormErrors = Partial<Record<keyof GuestFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateGuestForm(values: GuestFormValues): GuestFormErrors {
  const errors: GuestFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required";
  } else if (values.firstName.trim().length > 100) {
    errors.firstName = "Max 100 characters";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required";
  } else if (values.lastName.trim().length > 100) {
    errors.lastName = "Max 100 characters";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone is required";
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (!values.idNumber.trim()) {
    errors.idNumber = "ID number is required";
  }

  if (values.notes.length > 500) {
    errors.notes = "Max 500 characters";
  }

  return errors;
}

export function guestFormFromDoc(guest: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  idType: GuestIdType;
  idNumber: string;
  notes?: string;
}): GuestFormValues {
  return {
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    email: guest.email ?? "",
    whatsapp: guest.whatsapp ?? "",
    idType: guest.idType,
    idNumber: guest.idNumber,
    notes: guest.notes ?? ""
  };
}

export function toGuestMutationArgs(values: GuestFormValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim(),
    idType: values.idType,
    idNumber: values.idNumber.trim(),
    email: values.email.trim() || undefined,
    whatsapp: values.whatsapp.trim() || undefined,
    notes: values.notes.trim() || undefined
  };
}

export type GuestSortKey = "name" | "email" | "phone" | "createdAt";

export function sortGuests<T extends {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  createdAt: number;
}>(guests: T[], sortKey: GuestSortKey, ascending: boolean): T[] {
  const sorted = [...guests].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name":
        cmp = formatGuestName(a).localeCompare(formatGuestName(b));
        break;
      case "email":
        cmp = (a.email ?? "").localeCompare(b.email ?? "");
        break;
      case "phone":
        cmp = a.phone.localeCompare(b.phone);
        break;
      case "createdAt":
        cmp = a.createdAt - b.createdAt;
        break;
    }
    return ascending ? cmp : -cmp;
  });
  return sorted;
}

export function filterGuests<T extends {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
}>(guests: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return guests;
  }
  return guests.filter((guest) => {
    const haystack = [
      guest.firstName,
      guest.lastName,
      guest.email ?? "",
      guest.phone
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export const inputClassName =
  "border-input bg-background w-full rounded-lg border px-3 py-2 text-sm";
