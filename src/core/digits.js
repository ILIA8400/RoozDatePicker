const faMap = { "0":"۰","1":"۱","2":"۲","3":"۳","4":"۴","5":"۵","6":"۶","7":"۷","8":"۸","9":"۹" };
const enMap = { "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9" };

export function toPersianDigits(input) {
  return String(input).replace(/[0-9]/g, (d) => faMap[d]);
}

export function toLatinDigits(input) {
  return String(input).replace(/[۰-۹]/g, (d) => enMap[d]);
}

/**
 * digits: "auto" | "latin" | "persian"
 * - auto: اگر locale=fa => persian، وگرنه latin
 */
export function formatDigits(input, { locale = "fa", digits = "auto" } = {}) {
  const mode = digits === "auto" ? (locale === "fa" ? "persian" : "latin") : digits;
  if (mode === "persian") return toPersianDigits(input);
  return String(input); // latin
}
