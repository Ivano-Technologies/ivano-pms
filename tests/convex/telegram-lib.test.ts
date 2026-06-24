import { describe, expect, it } from "vitest";

import {
  buildTelegramDeepLink,
  parseStartCommand,
  telegramChatIdString,
  telegramDisplayName,
  telegramUserIdString
} from "../../convex/lib/telegram";

describe("parseStartCommand", () => {
  it("returns empty object for bare /start", () => {
    expect(parseStartCommand("/start")).toEqual({});
    expect(parseStartCommand("  /start  ")).toEqual({});
  });

  it("extracts property token from /start <token>", () => {
    expect(parseStartCommand("/start prop_abc123")).toEqual({
      token: "prop_abc123"
    });
  });

  it("extracts token when bot username is present", () => {
    expect(parseStartCommand("/start@IvanoPMSBot prop_abc123")).toEqual({
      token: "prop_abc123"
    });
  });

  it("returns null for non-start commands", () => {
    expect(parseStartCommand("/help")).toBeNull();
    expect(parseStartCommand("hello")).toBeNull();
  });
});

describe("telegramDisplayName", () => {
  it("builds a display name from Telegram user fields", () => {
    expect(
      telegramDisplayName({
        id: 42,
        first_name: "Ada",
        last_name: "Okonkwo",
        username: "ada_o"
      })
    ).toBe("Ada Okonkwo");
  });
});

describe("telegram id helpers", () => {
  it("stringifies chat and user ids", () => {
    expect(telegramChatIdString({ id: 9001, type: "private" })).toBe("9001");
    expect(
      telegramUserIdString({ id: 42, first_name: "Ada" })
    ).toBe("42");
  });
});

describe("buildTelegramDeepLink", () => {
  it("builds t.me link with encoded start token", () => {
    expect(buildTelegramDeepLink("IvanoPMSBot", "abc_123")).toBe(
      "https://t.me/IvanoPMSBot?start=abc_123"
    );
  });

  it("strips leading @ from bot username", () => {
    expect(buildTelegramDeepLink("@IvanoPMSBot", "tok")).toBe(
      "https://t.me/IvanoPMSBot?start=tok"
    );
  });
});
