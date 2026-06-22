"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { useQuery } from "convex/react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

const STORAGE_KEY = "ivano-selected-property-id";

type PropertyContextValue = {
  selectedPropertyId: Id<"property"> | undefined;
  setSelectedPropertyId: (id: Id<"property">) => void;
  propertyArgs: { selectedPropertyId?: Id<"property"> };
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const properties = useQuery(api.functions.managers.getMyProperties);
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<
    Id<"property"> | undefined
  >(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedPropertyIdState(stored as Id<"property">);
    }
  }, []);

  useEffect(() => {
    if (!properties || properties.length === 0) return;

    const valid =
      selectedPropertyId &&
      properties.some((p) => p._id === selectedPropertyId);

    if (!valid) {
      const first = properties[0]!._id;
      setSelectedPropertyIdState(first);
      localStorage.setItem(STORAGE_KEY, first);
    }
  }, [properties, selectedPropertyId]);

  const setSelectedPropertyId = useCallback((id: Id<"property">) => {
    setSelectedPropertyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const propertyArgs = useMemo(
    () =>
      selectedPropertyId ? { selectedPropertyId } : {},
    [selectedPropertyId]
  );

  const value = useMemo(
    () => ({
      selectedPropertyId,
      setSelectedPropertyId,
      propertyArgs
    }),
    [selectedPropertyId, setSelectedPropertyId, propertyArgs]
  );

  return (
    <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>
  );
}

export function usePropertyScope(): PropertyContextValue {
  const ctx = useContext(PropertyContext);
  if (!ctx) {
    return {
      selectedPropertyId: undefined,
      setSelectedPropertyId: () => {},
      propertyArgs: {}
    };
  }
  return ctx;
}
