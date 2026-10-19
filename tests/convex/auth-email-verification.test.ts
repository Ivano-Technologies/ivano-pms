import { describe, expect, it } from "vitest";

import { internal } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { googleProfile } from "../../convex/lib/googleProfile";
import { api, createTestConvex, seedAuthedManager } from "./helpers";

type T = ReturnType<typeof createTestConvex>;

/**
 * IVA-194: these tests drive the real @convex-dev/auth store mutations (auth:store), so the
 * library itself decides whether the users record gets emailVerificationTime. That is the only
 * thing upsertManagerFromAuth trusts when claiming a legacy manager row.
 */

const EMAIL = "Legacy.Owner@Test.com";

async function seedLegacyManager(t: T) {
  const seed = await seedAuthedManager(t);
  const now = Date.now();
  const legacyId = await t.run((ctx) =>
    ctx.db.insert("manager", {
      propertyId: seed.propertyId,
      email: "legacy.owner@test.com",
      fullName: "Legacy Owner",
      phone: "",
      role: "owner",
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    })
  );
  return legacyId;
}

/** What Convex Auth does in its OAuth callback: provider.profile(claims), then auth:store userOAuth. */
async function googleSignIn(t: T, claims: Parameters<typeof googleProfile>[0]): Promise<Id<"users">> {
  const signature = `sig_${claims.sub}`;
  await t.run((ctx) => ctx.db.insert("authVerifiers", { signature }));
  const { id, ...profile } = googleProfile(claims);
  await t.mutation(internal.auth.store, {
    args: { type: "userOAuth", provider: "google", providerAccountId: id, profile, signature }
  });
  return await accountUser(t, "google", id);
}

async function accountUser(t: T, provider: string, providerAccountId: string) {
  const account = await t.run((ctx) =>
    ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", provider).eq("providerAccountId", providerAccountId)
      )
      .unique()
  );
  expect(account).not.toBeNull();
  return account!.userId;
}

const getUser = (t: T, userId: Id<"users">) => t.run((ctx) => ctx.db.get("users", userId));
const claim = (t: T, userId: string) =>
  t.withIdentity({ subject: `${userId}|session_1` }).mutation(api.functions.managers.upsertManagerFromAuth, {});
const legacyAuthUserId = (t: T, id: Id<"manager">) =>
  t.run(async (ctx) => (await ctx.db.get("manager", id))?.authUserId ?? null);

describe("googleProfile maps Google's email_verified claim", () => {
  it("is verified only when email_verified is exactly true", () => {
    const base = { sub: "g-1", email: EMAIL, name: "L O", picture: "https://x/p.png" };
    expect(googleProfile({ ...base, email_verified: true })).toEqual({
      id: "g-1",
      name: "L O",
      email: EMAIL,
      image: "https://x/p.png",
      emailVerified: true
    });
    expect(googleProfile({ ...base, email_verified: false }).emailVerified).toBe(false);
    expect(googleProfile({ ...base, email_verified: "true" }).emailVerified).toBe(false);
    // Missing must be an explicit false: undefined would make the library treat OAuth as verified.
    expect(googleProfile(base).emailVerified).toBe(false);
  });
  it("an unverified Google profile maps to emailVerified false and keeps the email exactly as Google sent it", () => {
    // Convex Auth links users by exact email, so profile() must not lowercase or trim it.
    const mapped = googleProfile({ sub: "g-2", email: " Mixed.Case@Gmail.com ", email_verified: false });
    expect(mapped.emailVerified).toBe(false);
    expect(mapped.email).toBe(" Mixed.Case@Gmail.com ");
  });
});

describe("email verification through the real Convex Auth sign in paths (IVA-194)", () => {
  it("Google with email_verified=false gets no verification time and claims nothing", async () => {
    const t = createTestConvex();
    const legacyId = await seedLegacyManager(t);
    const userId = await googleSignIn(t, { sub: "g-false", email: EMAIL, email_verified: false });

    const user = await getUser(t, userId);
    expect(user?.email).toBe(EMAIL);
    expect(user?.emailVerificationTime).toBeUndefined();
    expect(await claim(t, userId)).toBeNull();
    expect(await legacyAuthUserId(t, legacyId)).toBeNull();
  });

  it("Google with email_verified missing gets no verification time and claims nothing", async () => {
    const t = createTestConvex();
    const legacyId = await seedLegacyManager(t);
    const userId = await googleSignIn(t, { sub: "g-missing", email: EMAIL });

    expect((await getUser(t, userId))?.emailVerificationTime).toBeUndefined();
    expect(await claim(t, userId)).toBeNull();
    expect(await legacyAuthUserId(t, legacyId)).toBeNull();
  });

  it("Google with email_verified=true gets a verification time and claims the legacy row", async () => {
    const t = createTestConvex();
    const legacyId = await seedLegacyManager(t);
    const userId = await googleSignIn(t, { sub: "g-true", email: EMAIL, email_verified: true });

    expect((await getUser(t, userId))?.emailVerificationTime).toEqual(expect.any(Number));
    expect(await claim(t, userId)).toBe(legacyId);
    expect(await legacyAuthUserId(t, legacyId)).toBe(userId);
  });

  it("control: without the mapping the library marks any Google email verified", async () => {
    // Why googleProfile must return an explicit boolean: the library's default for OAuth is verified.
    const t = createTestConvex();
    await t.run((ctx) => ctx.db.insert("authVerifiers", { signature: "sig_default" }));
    await t.mutation(internal.auth.store, {
      args: {
        type: "userOAuth",
        provider: "google",
        providerAccountId: "g-default",
        profile: { email: EMAIL },
        signature: "sig_default"
      }
    });
    const userId = await accountUser(t, "google", "g-default");
    expect((await getUser(t, userId))?.emailVerificationTime).toEqual(expect.any(Number));
  });

  it("Resend OTP sign in sets emailVerificationTime when the code is checked, and can claim", async () => {
    const t = createTestConvex();
    const legacyId = await seedLegacyManager(t);
    const code = "12345678";

    // Step 1 (send code): the library creates the user, still unverified.
    await t.mutation(internal.auth.store, {
      args: {
        type: "createVerificationCode",
        provider: "resend-otp",
        email: EMAIL,
        code,
        expirationTime: Date.now() + 15 * 60 * 1000,
        allowExtraProviders: false
      }
    });
    const userId = await accountUser(t, "resend-otp", EMAIL);
    expect((await getUser(t, userId))?.emailVerificationTime).toBeUndefined();
    expect(await claim(t, userId)).toBeNull();

    // Step 2 (enter code): verifyCodeAndSignIn marks the email verified.
    const result = await t.mutation(internal.auth.store, {
      args: {
        type: "verifyCodeAndSignIn",
        provider: "resend-otp",
        params: { email: EMAIL, code },
        generateTokens: false,
        allowExtraProviders: false
      }
    });
    expect(result).not.toBeNull();
    expect((await getUser(t, userId))?.emailVerificationTime).toEqual(expect.any(Number));
    expect(await claim(t, userId)).toBe(legacyId);
  });

  it("a wrong OTP code leaves the email unverified", async () => {
    const t = createTestConvex();
    await seedLegacyManager(t);
    await t.mutation(internal.auth.store, {
      args: {
        type: "createVerificationCode",
        provider: "resend-otp",
        email: EMAIL,
        code: "12345678",
        expirationTime: Date.now() + 15 * 60 * 1000,
        allowExtraProviders: false
      }
    });
    const userId = await accountUser(t, "resend-otp", EMAIL);
    const result = await t.mutation(internal.auth.store, {
      args: {
        type: "verifyCodeAndSignIn",
        provider: "resend-otp",
        params: { email: EMAIL, code: "00000000" },
        generateTokens: false,
        allowExtraProviders: false
      }
    });
    expect(result).toBeNull();
    expect((await getUser(t, userId))?.emailVerificationTime).toBeUndefined();
  });
});
