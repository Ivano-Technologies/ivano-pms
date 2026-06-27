"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ContextPanelState = {
  open: boolean;
  title: string;
  content: ReactNode | null;
};

type ContextPanelContextValue = ContextPanelState & {
  setOpen: (open: boolean) => void;
  setTitle: (title: string) => void;
  setContent: (content: ReactNode | null) => void;
  reset: () => void;
};

const ContextPanelContext = createContext<ContextPanelContextValue | null>(null);

const INITIAL_STATE: ContextPanelState = {
  open: false,
  title: "",
  content: null
};

export function ContextPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextPanelState>(INITIAL_STATE);

  const setOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setContent = useCallback((content: ReactNode | null) => {
    setState((prev) => ({ ...prev, content }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setOpen,
      setTitle,
      setContent,
      reset
    }),
    [state, setOpen, setTitle, setContent, reset]
  );

  return (
    <ContextPanelContext.Provider value={value}>
      {children}
    </ContextPanelContext.Provider>
  );
}

export function useContextPanel(): ContextPanelContextValue {
  const ctx = useContext(ContextPanelContext);
  if (!ctx) {
    throw new Error("useContextPanel must be used within ContextPanelProvider");
  }
  return ctx;
}

type ContextPanelProps = {
  className?: string;
};

export function ContextPanel({ className }: ContextPanelProps) {
  const { open, title, content, setOpen } = useContextPanel();

  if (!open) {
    return null;
  }

  return (
    <aside
      className={cn(
        "border-border bg-card hidden w-80 shrink-0 flex-col border-l lg:flex",
        className
      )}
      aria-label={title || "Context panel"}
      role="complementary"
    >
      <div className="border-border flex min-h-11 items-center justify-between gap-2 border-b px-4 py-2">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground inline-flex size-11 items-center justify-center"
          aria-label="Close context panel"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{content}</div>
    </aside>
  );
}
