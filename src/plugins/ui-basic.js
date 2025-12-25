import { el } from "../core/utils.js";

export function uiBasic() {
  return {
    name: "ui-basic",
    install(dp) {
      dp.root.classList.add("rooz-ui-basic");

      const header = el("div", { class: "rooz__header" });
      const btnPrev = el("button", { class: "rooz__btn", type: "button" }, [document.createTextNode("‹")]);
      const title = el("div", { class: "rooz__title" });
      const btnNext = el("button", { class: "rooz__btn", type: "button" }, [document.createTextNode("›")]);

      const weekdays = el("div", { class: "rooz__weekdays" });
      const grid = el("div", { class: "rooz__grid" });

      header.append(btnPrev, title, btnNext);
      dp.root.append(header, weekdays, grid);

      btnPrev.addEventListener("click", () => dp.prevMonth());
      btnNext.addEventListener("click", () => dp.nextMonth());

      const unsubscribeChange = dp.on("change", (payload) => {
        if (dp.isBoundToInput) {

          const pad2 = (n) => String(n).padStart(2, "0");

          if (payload.jalali && dp.state.calendar === "jalali") {
            const raw = `${payload.jalali.y}/${pad2(payload.jalali.m)}/${pad2(payload.jalali.d)}`;
            dp.target.value = dp.formatDigits(raw);
          } else {
            dp.target.value = dp.formatDigits(payload.iso);
          }

        }
      });

      const unsubscribeRender = dp.on("render", ({ state, labels, grid: cells }) => {
        // title
        const monthName = labels.months[state.viewMonth - 1];
        title.textContent = `${monthName} ${dp.formatDigits(state.viewYear)}`;

        // weekdays
        weekdays.innerHTML = "";
        for (let i = 0; i < 7; i++) {
          const idx = (labels.weekStart + i) % 7;
          weekdays.append(el("div", { class: "rooz__weekday" }, [document.createTextNode(labels.weekdays[idx])]));
        }

        // grid
        grid.innerHTML = "";
        for (const day of cells) {
          if (day === null) {
            grid.append(el("button", { class: "rooz__cell rooz__cell--empty", type: "button", disabled: true }, [""]));
            continue;
          }

          const isSelected =
            state.selected &&
            state.selected.y === state.viewYear &&
            state.selected.m === state.viewMonth &&
            state.selected.d === day;

          const cell = el(
            "button",
            {
              class: `rooz__cell ${isSelected ? "is-selected" : ""}`.trim(),
              type: "button",
              "data-day": day,
            },
            [document.createTextNode(dp.formatDigits(day))]
          );

          cell.addEventListener("click", () => dp.selectDay(day));
          grid.append(cell);
        }
      });

      dp.render();

      return () => {
        unsubscribeRender();
        unsubscribeChange();
      };
    },
  };
}
