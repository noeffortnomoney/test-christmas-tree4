const TZ = "Asia/Ho_Chi_Minh";

const dateTimeParts = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatDateTimeVN(iso: string): string {
  const p = Object.fromEntries(dateTimeParts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

const timeVN = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatTimeVN(date: Date): string {
  return timeVN.format(date);
}
