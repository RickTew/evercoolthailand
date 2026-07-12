"use client";

import { useSyncExternalStore } from "react";
import { formatWhen, DISPLAY_TIME_ZONE } from "@/app/admin/email/_lib/ui";

// localStorage key for the optional manual timezone override. "auto" (or absent)
// means "use this device's timezone". A specific IANA zone (e.g. "America/New_York")
// pins every Care timestamp to that zone instead. Set from Care settings.
export const TZ_OVERRIDE_KEY = "nei_display_tz";

// Resolve the viewer's effective timezone: a manual override if they set one,
// otherwise the device's own timezone, falling back to the team zone. Client-only.
export function resolveViewerTimeZone(): string {
  try {
    const override =
      typeof window !== "undefined" ? window.localStorage.getItem(TZ_OVERRIDE_KEY) : null;
    if (override && override !== "auto") return override;
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DISPLAY_TIME_ZONE;
  } catch {
    return DISPLAY_TIME_ZONE;
  }
}

// Re-resolve when the override changes in another tab or from settings.
function subscribeToTzOverride(onChange: () => void) {
  function onStorage(e: StorageEvent) {
    if (e.key === TZ_OVERRIDE_KEY) onChange();
  }
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

// Renders a timestamp in the VIEWER's own timezone. SSR and the first client
// paint use the team zone (so the server and client HTML match and React does not
// warn), then it swaps to the viewer's local zone after mount. Replaces bare
// {formatWhen(iso)} so every Care time reads in the staff member's local time.
export function LocalTime({
  iso,
  dateOnly = false,
  className,
}: {
  iso: string;
  dateOnly?: boolean;
  className?: string;
}) {
  // The viewer's zone is external, client-only state (localStorage + the device),
  // so it comes in through useSyncExternalStore: the team zone on the server, the
  // resolved local zone once mounted.
  const tz = useSyncExternalStore(
    subscribeToTzOverride,
    resolveViewerTimeZone,
    () => DISPLAY_TIME_ZONE,
  );
  return (
    <time
      dateTime={iso}
      className={className}
      suppressHydrationWarning
      title={`${formatWhen(iso, tz)} (${tz})`}
    >
      {formatWhen(iso, tz, { dateOnly })}
    </time>
  );
}
