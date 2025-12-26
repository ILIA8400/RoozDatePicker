# Rooz — Jalali (Persian) + Gregorian Datepicker (Plugin-based)

`rooz` is a lightweight, modern **plugin-based** datepicker for the web (Vanilla JS).  
It supports both **Jalali (Persian)** and **Gregorian** calendars.

> Current status (MVP)
- Month/year navigation
- Day selection
- `change` event on selection
- Input popup behavior (optional plugin)
- Optional **custom** month/year dropdowns (nice on mobile)
- Persian/Latin digits formatting via `digits`

---

## Quick Start

### 1) CSS
Include the sample CSS (you can copy and customize it later):

```html
<link rel="stylesheet" href="./demo/rooz.css" />
```

### 2) Jalali dependency (required for Persian calendar)
If you use `calendar: "jalali"`, you need `jalaali-js`. Easiest for now is CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/jalaali-js/dist/jalaali.min.js"></script>
```

> If `calendar: "jalali"` is used without `jalaali-js`, Rooz will throw an error.

---

## Usage

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
    calendar: "jalali",
    locale: "fa",
    digits: "persian", // "auto" | "latin" | "persian"
  })
    .use(popup({
      matchWidth: true,
      placement: "bottom-start",
      closeOnSelect: true,
    }))
    .use(uiBasic({
      headerDropdown: "custom", // custom month/year dropdowns
      yearRange: 80,
      yearSearch: true,
    }));

  dp.on("change", (payload) => {
    console.log("change:", payload);
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

## API

### Constructor
```js
const dp = new RoozDatepicker(targetOrSelector, options);
```

`targetOrSelector` can be:
- a selector string like `"#date"`
- or a DOM element like `document.querySelector("#date")`

### Options
- `calendar`: `"jalali"` | `"gregorian"` (default: `"jalali"`)
- `locale`: `"fa"` | `"en"` (default: `"fa"`)
- `digits`: `"auto"` | `"latin"` | `"persian"` (default: `"auto"`)
  - `auto`: Persian digits for `locale="fa"`, otherwise Latin digits
- `weekStart`: number 0..6 (optional)
- `jalaali`: inject `jalaali-js` manually (optional; MVP usually uses CDN)

### Methods
- `dp.use(plugin, pluginOptions?)`
- `dp.on(event, handler)` → returns an unsubscribe function
- `dp.setCalendar("jalali"|"gregorian")`
- `dp.setView(year, month)` (month: 1..12)
- `dp.nextMonth()`
- `dp.prevMonth()`
- `dp.selectDay(day)`
- `dp.render()`
- `dp.destroy()`

If `popup` plugin is installed:
- `dp.open()`
- `dp.close()`
- `dp.toggle()`

### Events
- `change` (most important)
- `render`
- `viewChange`
- `calendarChange`

### `change` payload
```js
dp.on("change", (p) => {
  // p.calendar => "jalali" | "gregorian"
  // p.selected => { y, m, d } in the current calendar
  // p.date => JS Date
  // p.gregorian => { y, m, d }
  // p.jalali => { y, m, d } or null
  // p.iso => "YYYY-MM-DD"
});
```

There is also a DOM CustomEvent on `dp.root`:
```js
dp.root.addEventListener("rooz:change", (e) => console.log(e.detail));
```

---

## Plugins

### 1) `uiBasic`
Basic UI (header + day grid)

```js
dp.use(uiBasic());
```

#### Options
- `headerDropdown`:
  - `false` → simple month/year title
  - `"custom"` → **custom** month/year dropdowns (mobile-safe, no overflow issues)
- `yearRange`: e.g. `50` means current year ±50
- `yearMin` / `yearMax`: fixed year range
- `yearSearch`: enable search input in year dropdown

Example:
```js
dp.use(uiBasic({ headerDropdown: "custom", yearRange: 80, yearSearch: true }));
```

### 2) `popup`
For input-bound usage:
- opens on input focus/click
- closes on outside click / ESC
- positions with flip + clamp

Example:
```js
dp.use(popup({ matchWidth: true, placement: "bottom-start" }));
```

> Note: `uiBasic` and `popup` cooperate using `data-rooz-instance` so clicks on dropdown panels (rendered on `document.body`) do NOT close the datepicker.

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

Typical behavior: opening the second input closes the first one (outside-click behavior), which is standard for popups.

---

## Styling (important CSS classes)

Core UI:
- `.rooz`
- `.rooz__header`, `.rooz__btn`, `.rooz__title`
- `.rooz__weekdays`, `.rooz__weekday`
- `.rooz__grid`, `.rooz__cell`, `.rooz__cell--empty`, `.rooz__cell.is-selected`

Custom dropdown:
- `.rooz__dropdowns`
- `.roozDD`, `.roozDD__btn`, `.roozDD__panel`, `.roozDD__search`
- `.roozDD__list`, `.roozDD__opt`, `.roozDD__opt.is-active`, `.roozDD__empty`

---

## License
MIT — see `LICENSE`.
