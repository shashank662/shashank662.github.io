const IST = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Kolkata',
});

/** "14:05:09 IST" for any instant. */
export function formatIST(date: Date): string {
  return `${IST.format(date)} IST`;
}

/** Whole seconds as "HH:MM:SS"; hours keep counting past 24. */
export function formatUptime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
}
