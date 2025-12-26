function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoFromGregorian({ y, m, d }) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function getJalaali(dp) {
  return dp.options?.jalaali || globalThis.jalaali;
}

function dateKeyFromGregorian(y, m, d) {
  return Date.UTC(y, m - 1, d);
}

function dateKeyFromDate(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return Date.UTC(y, m - 1, d);
}

function parseToDateKey(dp, input) {
  if (!input) return null;

  // Date
  if (input instanceof Date) return dateKeyFromDate(input);

  // ISO string: YYYY-MM-DD
  if (typeof input === "string") {
    const s = input.trim();
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) throw new Error(`constraints: invalid date string "${input}" (expected YYYY-MM-DD)`);
    return dateKeyFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  // Object: { y, m, d, calendar?: "jalali"|"gregorian" }
  if (typeof input === "object" && input.y && input.m && input.d) {
    const cal = input.calendar || dp.state.calendar || "gregorian";

    if (cal === "gregorian") {
      return dateKeyFromGregorian(input.y, input.m, input.d);
    }

    const j = getJalaali(dp);
    if (!j) throw new Error("constraints: jalaali-js is required for jalali min/max");
    const g = j.toGregorian(input.y, input.m, input.d);
    return dateKeyFromGregorian(g.gy, g.gm, g.gd);
  }

  throw new Error("constraints: unsupported min/max value");
}

function buildInfo(dp, calendar, y, m, d) {
  // خروجی: { calendar, selected, gregorian, jalali, iso, date, key }
  if (calendar === "gregorian") {
    const gregorian = { y, m, d };
    const iso = isoFromGregorian(gregorian);
    const key = dateKeyFromGregorian(y, m, d);

    let jalali = null;
    const j = getJalaali(dp);
    if (j) {
      const p = j.toJalaali(y, m, d);
      jalali = { y: p.jy, m: p.jm, d: p.jd };
    }

    return {
      calendar,
      selected: { y, m, d },
      gregorian,
      jalali,
      iso,
      date: new Date(y, m - 1, d),
      key,
    };
  }

  // jalali
  const j = getJalaali(dp);
  if (!j) throw new Error("constraints: jalaali-js is required for jalali calendar");

  const g = j.toGregorian(y, m, d);
  const gregorian = { y: g.gy, m: g.gm, d: g.gd };
  const iso = isoFromGregorian(gregorian);
  const key = dateKeyFromGregorian(gregorian.y, gregorian.m, gregorian.d);

  return {
    calendar,
    selected: { y, m, d },
    gregorian,
    jalali: { y, m, d },
    iso,
    date: new Date(gregorian.y, gregorian.m - 1, gregorian.d),
    key,
  };
}

export function constraints(options = {}) {
  const opt = {
    min: null,             // Date | "YYYY-MM-DD" | {y,m,d,calendar?}
    max: null,
    isDisabled: null,      // (info) => boolean
    ...options,
  };

  return {
    name: "constraints",
    install(dp) {
      const minKey = parseToDateKey(dp, opt.min);
      const maxKey = parseToDateKey(dp, opt.max);

      // API برای UI
      dp.isDisabledDay = (y, m, d, calendar = dp.state.calendar) => {
        const info = buildInfo(dp, calendar, y, m, d);

        if (minKey != null && info.key < minKey) return true;
        if (maxKey != null && info.key > maxKey) return true;

        if (typeof opt.isDisabled === "function") {
          return !!opt.isDisabled(info);
        }

        return false;
      };

      const originalSelectDay = dp.selectDay.bind(dp);
      dp.selectDay = (day) => {
        const y = dp.state.viewYear;
        const m = dp.state.viewMonth;
        const cal = dp.state.calendar;

        if (dp.isDisabledDay?.(y, m, day, cal)) return; 
        return originalSelectDay(day);
      };

      return () => {
        delete dp.isDisabledDay;
        dp.selectDay = originalSelectDay;
      };
    },
  };
}
