import { toLatinDigits } from "../core/digits.js";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegexFromPattern(pattern, strict) {
  // YYYY/MM/DD -> ^(\d{4})/(\d{1,2})/(\d{1,2})$
  let re = escapeRegExp(pattern);
  re = re.replace("YYYY", "(\\d{4})");
  re = re.replace("MM", strict ? "(\\d{2})" : "(\\d{1,2})");
  re = re.replace("DD", strict ? "(\\d{2})" : "(\\d{1,2})");
  return new RegExp("^" + re + "$");
}

function isValidGregorian(y, m, d) {
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function getJalaali(dp) {
  return dp.options?.jalaali || globalThis.jalaali;
}

function isValidJalali(dp, y, m, d) {
  const j = getJalaali(dp);
  if (!j) return false;

  if (typeof j.isValidJalaaliDate === "function") {
    return j.isValidJalaaliDate(y, m, d);
  }

  try {
    const g = j.toGregorian(y, m, d);
    return isValidGregorian(g.gy, g.gm, g.gd);
  } catch {
    return false;
  }
}

function jalaliToGregorian(dp, y, m, d) {
  const j = getJalaali(dp);
  if (!j) throw new Error("jalaali-js is required for jalali parsing");
  const g = j.toGregorian(y, m, d);
  return { y: g.gy, m: g.gm, d: g.gd };
}

function gregorianToJalali(dp, y, m, d) {
  const j = getJalaali(dp);
  if (!j) throw new Error("jalaali-js is required for jalali conversion");
  const p = j.toJalaali(y, m, d);
  return { y: p.jy, m: p.jm, d: p.jd };
}

export function parse(options = {}) {
  const opt = {
    pattern: "YYYY/MM/DD",
    calendar: "auto",          // "auto" | "jalali" | "gregorian"
    strict: false,             
    updateOn: "blur",          // "blur" | "change" | "input"
    allowEmpty: true,
    onInvalid: null,           // (value) => void
    ...options,
  };

  return {
    name: "parse",
    install(dp) {
      if (!dp.isBoundToInput) return;

      const re = buildRegexFromPattern(opt.pattern, opt.strict);

      function applyParsed(parts, cal) {
        dp.setCalendar(cal);
        dp.setView(parts.y, parts.m);
        dp.selectDay(parts.d);
      }

      function handle() {
        if (dp._roozSettingInputValue) return; 

        const raw = (dp.target.value ?? "").trim();
        if (!raw) {
          if (opt.allowEmpty) return;
          opt.onInvalid?.(raw);
          return;
        }

        const latin = toLatinDigits(raw);
        const m = latin.match(re);
        if (!m) {
          opt.onInvalid?.(raw);
          return;
        }

        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);

        const cal = opt.calendar === "auto" ? dp.state.calendar : opt.calendar;

        if (cal === "gregorian") {
          if (!isValidGregorian(y, mo, d)) {
            opt.onInvalid?.(raw);
            return;
          }
          applyParsed({ y, m: mo, d }, "gregorian");
          return;
        }

        // jalali
        if (!isValidJalali(dp, y, mo, d)) {
          opt.onInvalid?.(raw);
          return;
        }
        applyParsed({ y, m: mo, d }, "jalali");
      }

      // bind
      const evt = opt.updateOn;
      dp.target.addEventListener(evt, handle);

      const onKeyDown = (e) => {
        if (e.key === "Enter") handle();
      };
      dp.target.addEventListener("keydown", onKeyDown);

      return () => {
        dp.target.removeEventListener(evt, handle);
        dp.target.removeEventListener("keydown", onKeyDown);
      };
    },
  };
}
