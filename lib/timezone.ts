const BANGKOK_TZ = "Asia/Bangkok";

export function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BANGKOK_TZ });
}

export function formatBangkokDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    timeZone: BANGKOK_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatBangkokTime(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    timeZone: BANGKOK_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

export function bangkokTimeHHMM(): string {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function bangkokStartOfDay(dateStr?: string): string {
  const date = dateStr || bangkokToday();
  return `${date}T00:00:00+07:00`;
}

export function bangkokEndOfDay(dateStr?: string): string {
  const date = dateStr || bangkokToday();
  return `${date}T23:59:59+07:00`;
}
