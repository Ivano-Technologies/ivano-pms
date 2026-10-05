import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Id } from "../../../../../convex/_generated/dataModel";
import { ChannelTokenCard } from "./channel-token-card";

describe("ChannelTokenCard", () => {
  it("exposes WhatsApp OAuth Connect for the current property", () => {
    render(
      <ChannelTokenCard
        channel="whatsapp"
        isConnected={false}
        updatedAt={0}
        propertyId={"property1234567890ab" as Id<"property">}
      />
    );

    const connect = screen.getByRole("link", { name: /connect/i });
    expect(connect).toHaveAttribute(
      "href",
      "/api/oauth/whatsapp/start?propertyId=property1234567890ab"
    );
  });

  it("keeps Instagram as coming soon", () => {
    render(
      <ChannelTokenCard channel="instagram" isConnected={false} updatedAt={0} />
    );

    expect(screen.getByRole("button", { name: /coming soon/i })).toBeDisabled();
  });
});
