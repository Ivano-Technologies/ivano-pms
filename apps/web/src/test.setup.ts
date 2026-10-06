import "@testing-library/jest-dom/vitest";
import { act } from "react";
import * as React from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
(React as typeof React & { act: typeof act }).act = act;

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined)
  })
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children
}));
