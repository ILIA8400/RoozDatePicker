import { el } from "../core/utils.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toLatinDigits(str) {
  return String(str)
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}

function makeDropdown({
  instanceId,
  label = "",
  dir = "rtl",
  searchable = false,
  maxHeight = 260,
  getItems,
  onPick,
}) {
  let isOpen = false;
  let items = [];
  let filtered = [];
  let activeIndex = -1;

  const wrap = el("div", { class: "roozDD" });
  wrap.dataset.roozInstance = instanceId; // ✅ مهم

  const btn = el(
    "button",
    {
      class: "roozDD__btn",
      type: "button",
      "aria-expanded": "false",
    },
    [document.createTextNode(label)]
  );

  const panel = el("div", { class: "roozDD__panel", role: "listbox" });
  panel.dataset.roozInstance = instanceId;
  panel.style.maxHeight = `${maxHeight}px`;
  panel.style.display = "none";

  const search = el("input", {
    class: "roozDD__search",
    type: "text",
    placeholder: dir === "rtl" ? "جستجو…" : "Search…",
    autocomplete: "off",
    spellcheck: "false",
  });

  const list = el("div", { class: "roozDD__list" });

  if (searchable) panel.append(search);
  panel.append(list);

  wrap.append(btn);
  document.body.append(panel);

  // Important: panel is portaled to <body>. Prevent clicks inside the dropdown
  // from bubbling to the document outside-click handler of the popup plugin.
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());

  function measurePanel() {
    const prevDisp = panel.style.display;
    const prevVis = panel.style.visibility;

    panel.style.visibility = "hidden";
    panel.style.display = "block";

    // ارتفاع واقعی محتوا (با در نظر گرفتن maxHeight)
    const maxH = Number.parseFloat(panel.style.maxHeight) || maxHeight;
    const h = Math.min(panel.scrollHeight, maxH);

    // عرض هم از rect بگیر (اوکیه)
    const r = panel.getBoundingClientRect();

    panel.style.display = prevDisp;
    panel.style.visibility = prevVis;

    return { w: r.width, h };
  }

  function syncListMaxHeight(panelMaxH) {
    const searchH = searchable ? search.getBoundingClientRect().height : 0;
    const listMax = Math.max(120, panelMaxH - searchH);
    list.style.maxHeight = `${listMax}px`;
  }


  function positionPanel() {
  const rect = btn.getBoundingClientRect();
  const gap = 8;
  const pad = 8;

  const desiredW = 240;
  const maxW = window.innerWidth - pad * 2;
  const w = Math.min(desiredW, maxW);
  panel.style.width = `${w}px`;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  const avail = Math.max(160, Math.max(spaceBelow, spaceAbove) - gap - pad);
  const panelMaxH = Math.min(maxHeight, avail);
  panel.style.maxHeight = `${panelMaxH}px`;

  syncListMaxHeight(panelMaxH);

  const { h } = measurePanel();
  const openDown = spaceBelow >= h + gap || spaceBelow >= spaceAbove;
  let top = openDown ? rect.bottom + gap : rect.top - h - gap;

  const isRTL = dir === "rtl";
  let left = isRTL ? rect.right - w : rect.left;

  left = clamp(left, pad, window.innerWidth - w - pad);
  top = clamp(top, pad, window.innerHeight - h - pad);

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

  function setLabel(text) {
    btn.childNodes[0].textContent = text;
  }

  function focusOption(idx) {
    if (!filtered.length) return;
    activeIndex = Math.max(0, Math.min(idx, filtered.length - 1));

    const nodes = list.querySelectorAll(".roozDD__opt");
    nodes.forEach((n) => n.classList.remove("is-active"));

    const node = nodes[activeIndex];
    if (node) {
      node.classList.add("is-active");
      node.scrollIntoView({ block: "nearest" });
    }
  }

  function renderOptions() {
    list.innerHTML = "";

    filtered.forEach((it) => {
      const optBtn = el(
        "button",
        {
          class: "roozDD__opt",
          type: "button",
          role: "option",
        },
        [document.createTextNode(it.label)]
      );

      optBtn.addEventListener("click", () => {
        onPick(it.value);
        close();
      });

      list.append(optBtn);
    });

    if (!filtered.length) {
      list.append(
        el("div", { class: "roozDD__empty" }, [
          document.createTextNode(dir === "rtl" ? "یافت نشد" : "No results"),
        ])
      );
    }

    if (!searchable) focusOption(0);
  }

  function rebuild() {
    items = (getItems?.() || []).map((x) => {
      const label = String(x.label);
      return {
        value: x.value,
        label,
        _key: toLatinDigits(label).toLowerCase(),
      };
    });
    filtered = items;
    renderOptions();
  }

  function setOpen(next) {
    isOpen = next;
    btn.setAttribute("aria-expanded", String(isOpen));
    wrap.classList.toggle("is-open", isOpen);

    if (isOpen) {
      rebuild();
      panel.style.visibility = "hidden";
      panel.style.display = "block";
      syncListMaxHeight(maxHeight);
      positionPanel();
      panel.style.visibility = "visible";

      if (searchable) {
        search.value = "";
        search.focus();
      } else {
        focusOption(0);
      }
    } else {
      activeIndex = -1;
      panel.style.display = "none";
    }
  }

  function toggle() {
    setOpen(!isOpen);
  }
  function close() {
    setOpen(false);
  }

  btn.addEventListener("click", toggle);

  const onDocDown = (e) => {
    if (!isOpen) return;
    if (wrap.contains(e.target)) return;
    if (panel.contains(e.target)) return;
    close();
  };
  document.addEventListener("pointerdown", onDocDown, true);

  const onKeyDown = (e) => {
    if (!isOpen) {
      if (
        e.target === btn &&
        (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
      ) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      btn.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(activeIndex + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(activeIndex - 1);
      return;
    }

    if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        e.preventDefault();
        onPick(filtered[activeIndex].value);
        close();
        btn.focus();
      }
    }
  };
  document.addEventListener("keydown", onKeyDown, true);

  if (searchable) {

    search.addEventListener("input", () => {
      const q = toLatinDigits(search.value.trim()).toLowerCase();
      filtered = !q ? items : items.filter((it) => it._key.includes(q));
      renderOptions();

      activeIndex = filtered.length ? 0 : -1;
      const first = list.querySelector(".roozDD__opt");
      if (first) first.classList.add("is-active");
    });


    search.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusOption(0);
      }
    });
  }

  const onReposition = () => {
    if (isOpen) positionPanel();
  };
  window.addEventListener("resize", onReposition, { passive: true });
  window.addEventListener("scroll", onReposition, {
    passive: true,
    capture: true,
  });

  function destroy() {
    close();
    document.removeEventListener("pointerdown", onDocDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("resize", onReposition);
    window.removeEventListener("scroll", onReposition, true);
    panel.remove();
  }

  return { wrap, setLabel, close, destroy, rebuild };
}

export function uiBasic(options = {}) {
  const opt = {
    headerDropdown: false, // false | "custom"
    yearRange: 50,
    yearMin: null,
    yearMax: null,
    yearSearch: true,
    navIcons: null,
    ...options,
  };

  return {
    name: "ui-basic",
    install(dp) {
      dp.root.classList.add("rooz-ui-basic");

      function setBtnContent(btn, content, fallbackText) {
        btn.innerHTML = "";

        if (!content) {
          btn.textContent = fallbackText;
          return;
        }

        if (typeof content === "string") {
          btn.innerHTML = content;
          return;
        }

        if (content instanceof Node) {
          btn.appendChild(content);
          return;
        }

        if (typeof content === "function") {
          const out = content({ dp, btn });
          if (typeof out === "string") btn.innerHTML = out;
          else if (out instanceof Node) btn.appendChild(out);
          else btn.textContent = fallbackText;
          return;
        }

        btn.textContent = fallbackText;
      }

      const header = el("div", { class: "rooz__header" });
      const btnPrev = el("button", { class: "rooz__btn rooz__btn--nav", type: "button", "aria-label": "Previous month" });
      const btnNext = el("button", { class: "rooz__btn rooz__btn--nav", type: "button", "aria-label": "Next month" });

      setBtnContent(btnPrev, opt.navIcons?.prev, "‹");
      setBtnContent(btnNext, opt.navIcons?.next, "›");

      const title = el("div", { class: "rooz__title" });
      const weekdays = el("div", { class: "rooz__weekdays" });
      const grid = el("div", { class: "rooz__grid" });

      const instanceId =
        dp._roozInstanceId ||
        (dp._roozInstanceId =
          globalThis.crypto?.randomUUID?.() ??
          `rooz_${Math.random().toString(16).slice(2)}_${Date.now()}`);

      dp.root.dataset.roozInstance = instanceId;

      header.append(btnPrev);

      let monthDD = null;
      let yearDD = null;

      const dir = dp.options?.locale === "fa" ? "rtl" : "ltr";

      if (opt.headerDropdown === "custom") {
        const center = el("div", { class: "rooz__dropdowns" });

        monthDD = makeDropdown({
          instanceId,
          dir,
          searchable: false,
          getItems: () => {
            const labels = dp.adapter.labels();
            return labels.months.map((name, i) => ({
              value: i + 1,
              label: name,
            }));
          },
          onPick: (m) => dp.setView(dp.state.viewYear, Number(m)),
        });

        yearDD = makeDropdown({
          instanceId,
          dir,
          searchable: !!opt.yearSearch,
          getItems: () => {
            let minY, maxY;

            if (
              typeof opt.yearMin === "number" &&
              typeof opt.yearMax === "number"
            ) {
              minY = opt.yearMin;
              maxY = opt.yearMax;
            } else {
              const r = typeof opt.yearRange === "number" ? opt.yearRange : 50;
              minY = dp.state.viewYear - r;
              maxY = dp.state.viewYear + r;
            }

            const out = [];
            for (let y = minY; y <= maxY; y++) {
              const label = dp.formatDigits ? dp.formatDigits(y) : String(y);
              out.push({ value: y, label });
            }
            return out;
          },
          onPick: (y) => dp.setView(Number(y), dp.state.viewMonth),
        });

        center.append(monthDD.wrap, yearDD.wrap);
        header.append(center);
      } else {
        header.append(title);
      }

      header.append(btnNext);
      dp.root.append(header, weekdays, grid);

      btnPrev.addEventListener("click", () => dp.prevMonth());
      btnNext.addEventListener("click", () => dp.nextMonth());

      const unsubscribeChange = dp.on("change", (payload) => {
        if (!dp.isBoundToInput) return;
        if (dp.formatValue) return;

        const pad2 = (n) => String(n).padStart(2, "0");

        if (payload.jalali && dp.state.calendar === "jalali") {
          const raw = `${payload.jalali.y}/${pad2(payload.jalali.m)}/${pad2(
            payload.jalali.d
          )}`;
          dp.target.value = dp.formatDigits ? dp.formatDigits(raw) : raw;
        } else {
          const iso = payload.iso;
          dp.target.value = dp.formatDigits ? dp.formatDigits(iso) : iso;
        }
      });

      const unsubscribeRender = dp.on(
        "render",
        ({ state, labels, grid: cells }) => {
          if (opt.headerDropdown === "custom") {
            const monthName = labels.months[state.viewMonth - 1];
            const yearText = dp.formatDigits
              ? dp.formatDigits(state.viewYear)
              : String(state.viewYear);

            monthDD?.setLabel(monthName);
            yearDD?.setLabel(yearText);

            monthDD?.rebuild();
            yearDD?.rebuild();
          } else {
            const monthName = labels.months[state.viewMonth - 1];
            const yearText = dp.formatDigits
              ? dp.formatDigits(state.viewYear)
              : String(state.viewYear);
            title.textContent = `${monthName} ${yearText}`;
          }

          weekdays.innerHTML = "";
          for (let i = 0; i < 7; i++) {
            const idx = (labels.weekStart + i) % 7;
            weekdays.append(
              el("div", { class: "rooz__weekday" }, [
                document.createTextNode(labels.weekdays[idx]),
              ])
            );
          }

          grid.innerHTML = "";
          for (const day of cells) {
            if (day === null) {
              grid.append(
                el(
                  "button",
                  {
                    class: "rooz__cell rooz__cell--empty",
                    type: "button",
                    disabled: true,
                  },
                  [""]
                )
              );
              continue;
            }

            const isSelected =
              state.selected &&
              state.selected.y === state.viewYear &&
              state.selected.m === state.viewMonth &&
              state.selected.d === day;

            const dayText = dp.formatDigits
              ? dp.formatDigits(day)
              : String(day);

            const isDisabled =
              dp.isDisabledDay?.(
                state.viewYear,
                state.viewMonth,
                day,
                state.calendar
              ) ?? false;

            const cell = el(
              "button",
              {
                class: `rooz__cell ${isSelected ? "is-selected" : ""} ${
                  isDisabled ? "is-disabled" : ""
                }`.trim(),
                type: "button",
                "data-day": day,
                disabled: isDisabled,
              },
              [document.createTextNode(dayText)]
            );

            if (!isDisabled) {
              cell.addEventListener("click", () => dp.selectDay(day));
            }
            grid.append(cell);
          }
        }
      );

      dp.render();

      return () => {
        unsubscribeRender();
        unsubscribeChange();
        monthDD?.destroy();
        yearDD?.destroy();
      };
    },
  };
}
