import { formatDigits } from "../core/digits.js";

function formatFromParts({ y, m, d }, pattern) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return pattern
    .replaceAll("YYYY", String(y))
    .replaceAll("MM", pad2(m))
    .replaceAll("DD", pad2(d));
}

export function format(options = {}) {
  const opt = {
    pattern: "YYYY/MM/DD",
    calendar: "auto", // "auto" | "jalali" | "gregorian"
    digits: undefined,
    writeToInput: true,
    ...options,
  };

  return {
    name: "format",
    install(dp) {
      dp.formatValue = (payloadOrParts) => {
        const digitsMode = opt.digits ?? dp.options?.digits ?? "auto";
        const locale = dp.options?.locale ?? "fa";

        let parts = null;

        if (payloadOrParts?.jalali || payloadOrParts?.gregorian) {
          const cal = opt.calendar === "auto" ? dp.state.calendar : opt.calendar;
          parts = cal === "jalali" ? payloadOrParts.jalali : payloadOrParts.gregorian;
        } else {
          parts = payloadOrParts;
        }

        if (!parts) return "";

        const raw = formatFromParts(parts, opt.pattern);
        return formatDigits(raw, { locale, digits: digitsMode });
      };

      const off = dp.on("change", (payload) => {
        if (!opt.writeToInput) return;
        if (!dp.isBoundToInput) return;

        dp._roozSettingInputValue = true;
        dp.target.value = dp.formatValue(payload);
        queueMicrotask(() => {
          dp._roozSettingInputValue = false;
        });
      });

      return () => {
        off();
        delete dp.formatValue;
      };
    },
  };
}
