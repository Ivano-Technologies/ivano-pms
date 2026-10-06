/**
 * Shared Clerk theme for <ClerkProvider> and <SignIn> (Lobby Light, Wave 1).
 * Clerk Core 3 (@clerk/nextjs 7): layout options live under `appearance.options`.
 * Invite only: `footerAction` is hidden so there is no sign up link. That is not access
 * control; the Clerk Dashboard sign up mode must also be set to Restricted.
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#B5472F",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#141B26",
    colorMutedForeground: "#5C6673",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#141B26",
    colorBorder: "#E8E2D8",
    colorRing: "#B5472F",
    colorDanger: "#B23A48",
    colorSuccess: "#4F7A5A",
    colorWarning: "#8A6420",
    colorNeutral: "#141B26",
    colorShadow: "#141B26",
    fontFamily: "var(--font-jakarta), system-ui, sans-serif",
    fontSize: "1rem",
    borderRadius: "0.625rem"
  },
  options: {
    logoImageUrl: "/brand/iv1-mark.svg",
    logoLinkUrl: "/",
    socialButtonsVariant: "blockButton"
  },
  elements: {
    rootBox: "w-full max-w-[420px]",
    cardBox: "w-full max-w-[420px] rounded-[20px] border border-border shadow-[var(--shadow-e3)]",
    logoBox: "justify-center",
    logoImage: "h-[29px] w-auto",
    headerTitle: "font-display text-[26px] leading-8 font-medium text-ink max-sm:text-2xl",
    headerSubtitle: "text-muted-foreground text-[15px]",
    socialButtonsBlockButton: "h-[46px] border-[#D6CFC2] font-semibold",
    formFieldLabel: "text-sm font-semibold",
    formFieldInput: "h-[46px] border-[#8C939F] text-base",
    formButtonPrimary:
      "h-[46px] bg-primary hover:bg-[#9A3B27] text-[15px] font-semibold normal-case",
    footer: "bg-sunken",
    /** Hides "Don't have an account? Sign up" (invite only). */
    footerAction: "hidden"
  }
} as const;

/** Card copy. The title is localization, not CSS, so it shows even before the Dashboard rename. */
export const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to Ivano PMS",
      subtitle: "Welcome back. Sign in to open your front desk."
    }
  }
};
