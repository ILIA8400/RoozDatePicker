import { Emitter } from "./emitter.js";
import { el, isInput, pad2 } from "./utils.js";
import { createGregorianAdapter } from "../adapters/gregorian.js";
import { createJalaliAdapter } from "../adapters/jalali.js";
import { formatDigits } from "./digits.js";

export class RoozDatepicker {
  constructor(target, options = {}) {
    this.options = {
      calendar: "jalali",
      locale: "fa",
      digits: "auto",
      weekStart: undefined,
      jalaali: undefined,
      ...options,
    };

    this.emitter = new Emitter();
    this.plugins = [];
    this._pluginCleanups = [];

    this.target = (typeof target === "string") ? document.querySelector(target) : target;
    if (!this.target) throw new Error("Target element not found.");

    this.isBoundToInput = isInput(this.target);

    // root container
    this.root = el("div", { class: "rooz" });
    if (this.isBoundToInput) {
      // insert after input
      this.target.insertAdjacentElement("afterend", this.root);
      this.root.classList.add("rooz--popup");
    } else {
      this.target.appendChild(this.root);
    }

    this._setAdapter(this.options.calendar);

    const t = this.adapter.todayParts();
    this.state = {
      calendar: this.adapter.id,
      locale: this.options.locale,
      viewYear: t.y,
      viewMonth: t.m,
      selected: null, // { y,m,d } in adapter calendar
    };

    this.formatDigits = (value) =>
      formatDigits(value, { locale: this.options.locale, digits: this.options.digits });

    // initial event
    this.emitter.emit("init", { instance: this });
  }

  _setAdapter(calendar) {
    if (calendar === "gregorian") {
      this.adapter = createGregorianAdapter({
        locale: this.options.locale,
        weekStart: this.options.weekStart,
      });
    } else {
      this.adapter = createJalaliAdapter({
        locale: this.options.locale,
        weekStart: this.options.weekStart,
        jalaali: this.options.jalaali,
      });
    }
  }

  use(plugin, pluginOptions = {}) {
    if (!plugin) return this;
    const installed = plugin.install?.(this, pluginOptions);
    if (typeof installed === "function") this._pluginCleanups.push(installed);
    else if (installed?.destroy) this._pluginCleanups.push(() => installed.destroy());
    this.plugins.push(plugin);
    return this;
  }

  on(event, handler) {
    return this.emitter.on(event, handler);
  }

  emit(event, payload) {
    this.emitter.emit(event, payload);
  }

  setCalendar(calendar) {
    if (calendar !== "jalali" && calendar !== "gregorian") return;
    if (this.adapter.id === calendar) return;

    let anchorDate = null;
    if (this.state.selected) {
      anchorDate = this.adapter.toDateObject(this.state.selected.y, this.state.selected.m, this.state.selected.d);
    } else {
      const t = this.adapter.todayParts();
      anchorDate = this.adapter.toDateObject(t.y, t.m, t.d);
    }

    this._setAdapter(calendar);

    const p = this.adapter.fromDateObject(anchorDate);
    this.state.calendar = this.adapter.id;
    this.state.viewYear = p.y;
    this.state.viewMonth = p.m;
    this.state.selected = null;

    this.render();
    this.emit("calendarChange", { calendar });
  }

  setView(year, month) {
    this.state.viewYear = year;
    this.state.viewMonth = month; // 1..12
    this.render();
    this.emit("viewChange", { year, month });
  }

  nextMonth() {
    let { viewYear: y, viewMonth: m } = this.state;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    this.setView(y, m);
  }

  prevMonth() {
    let { viewYear: y, viewMonth: m } = this.state;
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    this.setView(y, m);
  }

  selectDay(day) {
    const y = this.state.viewYear;
    const m = this.state.viewMonth;
    this.state.selected = { y, m, d: day };

    const date = this.adapter.toDateObject(y, m, day); // JS Date (Gregorian base)
    const gregorian = { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };

    let jalali = null;
    if (this.adapter.id === "jalali") {
      jalali = { y, m, d: day };
    } else {
      const lib = this.options.jalaali || globalThis.jalaali;
      if (lib?.toJalaali) {
        const j = lib.toJalaali(gregorian.y, gregorian.m, gregorian.d);
        jalali = { y: j.jy, m: j.jm, d: j.jd };
      }
    }

    const payload = {
      calendar: this.adapter.id,
      selected: { y, m, d: day },
      date, // JS Date
      gregorian, // {y,m,d}
      jalali,    // {y,m,d} or null
      iso: `${gregorian.y}-${pad2(gregorian.m)}-${pad2(gregorian.d)}`
    };

    this.render();
    this.emit("change", payload);

    this.root.dispatchEvent(new CustomEvent("rooz:change", { detail: payload }));
  }

  getMonthGrid() {
    const { viewYear: y, viewMonth: m } = this.state;
    const { weekStart } = this.adapter.labels();
    const firstWd = this.adapter.firstWeekdayOfMonth(y, m); // 0..6
    const leading = (firstWd - weekStart + 7) % 7;
    const days = this.adapter.monthLength(y, m);

    const cells = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }

  render() {
    this.emit("render", {
      state: { ...this.state },
      labels: this.adapter.labels(),
      grid: this.getMonthGrid(),
    });
  }

  destroy() {
    for (const cleanup of this._pluginCleanups.reverse()) cleanup();
    this._pluginCleanups = [];
    this.plugins = [];
    this.emitter.clear();
    this.root.remove();
  }
}
