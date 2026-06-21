import "@testing-library/jest-dom/vitest";
import { act } from "react";
import * as React from "react";
import { vi } from "vitest";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
(React as typeof React & { act: typeof act }).act = act;

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: "clerk_test" }),
  useUser: () => ({
    isLoaded: true,
    user: {
      id: "clerk_test",
      fullName: "Test Manager",
      primaryEmailAddress: { emailAddress: "manager@test.com" }
    }
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children
}));
