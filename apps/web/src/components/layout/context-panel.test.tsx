import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  ContextPanel,
  ContextPanelProvider,
  useContextPanel
} from "./context-panel";

function PanelProbe() {
  const { open, setOpen, setTitle, setContent } = useContextPanel();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setTitle("Booking context");
          setContent(<p>Guest history and checklist</p>);
          setOpen(true);
        }}
      >
        Open panel
      </button>
      <span>{open ? "open" : "closed"}</span>
    </div>
  );
}

describe("ContextPanel", () => {
  it("opens with a title and dismiss control", () => {
    render(
      <ContextPanelProvider>
        <PanelProbe />
        <ContextPanel />
      </ContextPanelProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open panel" }));
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: /booking context/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close context panel/i }));
    expect(screen.getByText("closed")).toBeInTheDocument();
  });
});
