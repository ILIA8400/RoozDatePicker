# Rooz — Jalali (Persian) + Gregorian Datepicker (Plugin-based)

`rooz` is a lightweight, modern **plugin-based** datepicker for the web (Vanilla JS).  
It supports both **Jalali (Persian)** and **Gregorian** calendars, with a small core and optional plugins.

> Status (MVP+)
- Month/year navigation
- Day selection + `change` event
- **Popup** behavior for inputs (optional plugin)
- **Inline** rendering (no popup)
- Optional **custom month/year dropdown** header (mobile-friendly)
- **Digits formatting** (`latin` / `persian` / `auto`)
- **Format** plugin (controls input output format)
- **Parse** plugin (typed input → sync datepicker state)
- **Constraints** plugin (min/max + disabled dates)

---

## Installation

Currently Rooz is shipped as source (no npm package yet).

1. Clone or download the repo
2. Serve the folder with a local dev server (ESM imports won't work reliably over `file://`)

Example:

```bash
git clone <your-repo-url>
cd RoozDatePicker
npx serve .
```

Then open `demo/index.html`.

---

## Demo

Open: `demo/index.html`  
Styles: `demo/rooz.css`

> Jalali support requires `jalaali-js` (load via CDN or bundle it yourself).

---

## Quick Start

### A) Bind to an input + popup

```html
<input id="date" placeholder="1404/10/04" />

<link rel="stylesheet" href="./demo/rooz.css" />
<script src="https://cdn.jsdelivr.net/npm/jalaali-js/dist/jalaali.min.js"></script>

<script type="module">
  import { RoozDatepicker } from "./src/core/rooz.js";
  import { uiBasic } from "./src/plugins/ui-basic.js";
  import { popup } from "./src/plugins/popup.js";

  const dp = new RoozDatepicker("#date", {
    calendar: "jalali",  // "jalali" | "gregorian"
    locale: "fa",        // "fa" | "en"
    digits: "persian",   // "auto" | "latin" | "persian"
  })
    .use(popup({ matchWidth: true, placement: "bottom-start" }))
    .use(uiBasic({ headerDropdown: "custom", yearRange: 10, yearSearch: true }));

  dp.on("change", (payload) => {
    console.log("change:", payload.iso, payload.jalali, payload.gregorian);
  });
</script>
```

### B) Inline (render inside a container)

```html
<div id="inline"></div>

<link rel="stylesheet" href="./demo/rooz.css" />

<script type="module">
  import { RoozDatepicker } from "./src/core/rooz.js";
  import { uiBasic } from "./src/plugins/ui-basic.js";

  new RoozDatepicker("#inline", { calendar: "gregorian", locale: "en", digits: "latin" })
    .use(uiBasic());
</script>
```

---

## Core API

### Constructor

```js
const dp = new RoozDatepicker(targetOrSelector, options);
```

**Core options**
- `calendar`: `"jalali"` | `"gregorian"` (default: `"jalali"`)
- `locale`: `"fa"` | `"en"` (default: `"fa"`)
- `digits`: `"auto"` | `"latin"` | `"persian"` (default: `"auto"`)
- `weekStart`: optional number `0..6` (overrides adapter default)
- `jalaali`: optional injected jalaali instance (otherwise `globalThis.jalaali` is used)

### Methods

- `dp.use(plugin)` – install a plugin
- `dp.on(event, handler)` – listen to events
- `dp.render()` – trigger UI render (plugins usually call this for you)
- `dp.setView(year, month)` – change visible month/year
- `dp.prevMonth()` / `dp.nextMonth()`
- `dp.setCalendar("jalali" | "gregorian")`
- `dp.selectDay(dayNumber)`
- `dp.destroy()`

### Events

#### `change`
Triggered when a day is selected (and not blocked by constraints).

Payload:

```js
{
  calendar: "jalali" | "gregorian",
  selected: { y, m, d },
  date: Date,                 // JS Date (absolute)
  gregorian: { y, m, d },
  jalali: { y, m, d } | null,
  iso: "YYYY-MM-DD"
}
```

#### `render`
Triggered when the datepicker should (re)render.

```js
{
  state: { ... },
  labels: { months, weekdays, weekStart, ... },
  grid: (number|null)[]       // month grid (null = empty cell)
}
```

Other internal events: `viewChange`, `calendarChange`, `init`.

---

## Plugins

Install plugins with:

```js
dp.use(popup()).use(uiBasic());
```

Plugins are small and composable. A plugin is an object with:
- `name`
- `install(dp)` → returns a cleanup function

### 1) `uiBasic` (UI renderer)

```js
import { uiBasic } from "./src/plugins/ui-basic.js";

dp.use(uiBasic({
  headerDropdown: false,      // false | "custom"
  yearRange: 50,              // current year ± 50 (when yearMin/yearMax not provided)
  yearMin: null,              // fixed min year (optional)
  yearMax: null,              // fixed max year (optional)
  yearSearch: true,           // search box for year dropdown (supports Persian/Arabic digits too)
  navIcons: null,             // { prev, next } (string|Node|fn)
}));
```

#### Custom nav icons

```js
dp.use(uiBasic({
  navIcons: {
    prev: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    next: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
}));
```

### 2) `popup` (attach to input)

```js
import { popup } from "./src/plugins/popup.js";

dp.use(popup({
  placement: "bottom-start",  // bottom-start | bottom-end | top-start | top-end
  offset: 8,
  portal: true,               // move dp.root to <body>
  matchWidth: false,          // popup width = input width
  zIndex: 1000,
  closeOnSelect: true,
  closeOnEsc: true,
  closeOnOutsideClick: true,
  flip: true,
}));
```

> Note: `uiBasic` and `popup` cooperate using `data-rooz-instance` so clicks on dropdown panels (rendered on `document.body`) do **not** close the datepicker.

### 3) `format` (control output value)

Writes formatted value to the input on selection, and exposes `dp.formatValue(payloadOrParts)`.

```js
import { format } from "./src/plugins/format.js";

dp.use(format({
  pattern: "YYYY/MM/DD",      // supports YYYY, MM, DD
  calendar: "auto",           // "auto" | "jalali" | "gregorian"
  digits: undefined,          // override digits mode (optional)
  writeToInput: true,
}));
```

### 4) `parse` (typed input → sync datepicker)

Parses the input value and updates the view/selection (supports Persian/Arabic digits).

```js
import { parse } from "./src/plugins/parse.js";

dp.use(parse({
  pattern: "YYYY/MM/DD",
  calendar: "auto",           // "auto" | "jalali" | "gregorian"
  strict: false,              // if true: MM/DD must be 2 digits
  updateOn: "blur",           // "blur" | "change" | "input"
  allowEmpty: true,
  onInvalid: (value) => console.warn("invalid:", value),
}));
```

### 5) `constraints` (min/max + disable dates)

Adds `dp.isDisabledDay(y,m,d,calendar)` and prevents selecting disabled days.

```js
import { constraints } from "./src/plugins/constraints.js";

dp.use(constraints({
  min: "2025-01-01",          // Date | "YYYY-MM-DD" | {y,m,d,calendar?}
  max: "2026-12-31",
  isDisabled: ({ date, iso, gregorian, jalali, calendar }) => {
    // example: disable Fridays (JS day 5)
    return date.getDay() === 5;
  },
}));
```

---

## Multiple inputs (Multiple instances)

Multiple instances are supported:

```js
const a = new RoozDatepicker("#a", { calendar: "jalali", locale: "fa" })
  .use(popup({ matchWidth: true }))
  .use(uiBasic({ headerDropdown: "custom" }));

const b = new RoozDatepicker("#b", { calendar: "gregorian", locale: "en" })
  .use(popup({ matchWidth: true }))
  .use(uiBasic({ headerDropdown: "custom" }));
```

---

## Styling

Default styles are in `demo/rooz.css`.  
Useful class hooks:

Core:
- `.rooz`
- `.rooz__header`, `.rooz__btn`, `.rooz__title`
- `.rooz__weekdays`, `.rooz__weekday`
- `.rooz__grid`, `.rooz__cell`, `.rooz__cell--empty`, `.rooz__cell.is-selected`, `.rooz__cell.is-disabled`

Custom dropdown:
- `.rooz__dropdowns`
- `.roozDD`, `.roozDD__btn`, `.roozDD__panel`, `.roozDD__search`
- `.roozDD__list`, `.roozDD__opt`, `.roozDD__opt.is-active`, `.roozDD__empty`

---

## License

MIT — see `LICENSE`.
