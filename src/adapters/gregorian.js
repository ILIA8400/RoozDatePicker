export function createGregorianAdapter({ locale = "en", weekStart } = {}) {
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthsFa = ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];

  const weekdaysEn = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const weekdaysFa = ["ی","د","س","چ","پ","ج","ش"]; 

  const _weekStart = (weekStart ?? 1); 

  function todayParts() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }

  function monthLength(y, m) {
    return new Date(y, m, 0).getDate(); 
  }

  function toDateObject(y, m, d) {
    return new Date(y, m - 1, d);
  }

  function fromDateObject(date) {
    return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
  }

  function firstWeekdayOfMonth(y, m) {
    // 0..6 (0 Sunday)
    return new Date(y, m - 1, 1).getDay();
  }

  function labels() {
    return {
      months: locale === "fa" ? monthsFa : monthsEn,
      weekdays: locale === "fa" ? weekdaysFa : weekdaysEn,
      weekStart: _weekStart
    };
  }

  return {
    id: "gregorian",
    labels,
    todayParts,
    monthLength,
    toDateObject,
    fromDateObject,
    firstWeekdayOfMonth,
  };
}
