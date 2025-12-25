export function createJalaliAdapter({ locale = "fa", weekStart, jalaali } = {}) {
  const lib = jalaali || globalThis.jalaali;
  if (!lib) {
    throw new Error(
      "jalaali-js not found. Provide { jalaali } in options or include it via CDN (jalaali global)."
    );
  }

  const monthsFa = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  const monthsEn = ["Farvardin","Ordibehesht","Khordad","Tir","Mordad","Shahrivar","Mehr","Aban","Azar","Dey","Bahman","Esfand"];

  const weekdaysFa = ["ش","ی","د","س","چ","پ","ج"]; 
  const weekdaysEn = ["Sa","Su","Mo","Tu","We","Th","Fr"];

  const _weekStart = (weekStart ?? 6); 

  function todayParts() {
    const now = new Date();
    const g = { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
    const j = lib.toJalaali(g.gy, g.gm, g.gd);
    return { y: j.jy, m: j.jm, d: j.jd };
  }

  function monthLength(y, m) {
    return lib.jalaaliMonthLength(y, m);
  }

  function toDateObject(y, m, d) {
    const g = lib.toGregorian(y, m, d);
    return new Date(g.gy, g.gm - 1, g.gd);
  }

  function fromDateObject(date) {
    const j = lib.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { y: j.jy, m: j.jm, d: j.jd };
  }

  function firstWeekdayOfMonth(y, m) {
    const g = lib.toGregorian(y, m, 1);
    return new Date(g.gy, g.gm - 1, g.gd).getDay(); // 0..6
  }

  function labels() {
    return {
      months: locale === "fa" ? monthsFa : monthsEn,
      weekdays: locale === "fa" ? weekdaysFa : weekdaysEn,
      weekStart: _weekStart
    };
  }

  return {
    id: "jalali",
    labels,
    todayParts,
    monthLength,
    toDateObject,
    fromDateObject,
    firstWeekdayOfMonth,
    _lib: lib
  };
}
