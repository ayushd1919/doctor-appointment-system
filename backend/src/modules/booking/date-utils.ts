export function atMidnightUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export function isWeekendUTC(d: Date) {
  const wd = d.getUTCDay(); // 0 Sun .. 6 Sat
  return wd === 0 || wd === 6;
}

export function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60 * 1000);
}

/** Combine a date (at 00:00 UTC) with a TIME column string "HH:MM[:SS]" as UTC */
export function combineDateAndTimeUTC(dayStartUTC: Date, timeStr: string) {
  const [hh, mm, ss] = timeStr.split(':').map(v => parseInt(v, 10));
  return new Date(Date.UTC(
    dayStartUTC.getUTCFullYear(),
    dayStartUTC.getUTCMonth(),
    dayStartUTC.getUTCDate(),
    hh || 0, mm || 0, ss || 0, 0
  ));
}
