"use client";

export function SettingsPageClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Property configuration.
        </p>
      </div>

      <section className="space-y-3">
        <div className="border-border rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Connected channels</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Channel integrations (Telegram, Email inbound) are deferred
            post-launch. They will return once the messaging pipeline is
            re-enabled.
          </p>
        </div>
      </section>
    </div>
  );
}
