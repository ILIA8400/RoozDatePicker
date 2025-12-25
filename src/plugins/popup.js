export function popup(options = {}) {
  const opt = {
    placement: "bottom-start", // bottom-start | bottom-end | top-start | top-end
    offset: 8,
    portal: true, // append to body
    matchWidth: false, // popup width = input width
    zIndex: 1000,
    closeOnSelect: true,
    closeOnEsc: true,
    closeOnOutsideClick: true,
    flip: true,
    ...options,
  };

  return {
    name: "popup",
    install(dp) {
      if (!dp.isBoundToInput) return;

      let isOpen = false;
      let lastPlacement = opt.placement;
      let rafId = null;

      const doc = dp.root.ownerDocument;
      const win = doc.defaultView;

      const originalParent = dp.root.parentNode;
      const originalNext = dp.root.nextSibling;

      if (opt.portal) {
        doc.body.appendChild(dp.root);
        dp.root.classList.add("rooz--portal");
      }

      dp.root.style.position = "absolute";
      dp.root.style.top = "0px";
      dp.root.style.left = "0px";
      dp.root.style.zIndex = String(opt.zIndex);
      dp.root.style.display = "none";

      function getDir() {
        const elDir = dp.target.getAttribute("dir");
        if (elDir) return elDir.toLowerCase();
        const cs = win.getComputedStyle(dp.target);
        if (cs.direction) return cs.direction.toLowerCase();
        const docDir = doc.documentElement.getAttribute("dir");
        return (docDir || "ltr").toLowerCase();
      }

      function measurePopup() {
        const prevVis = dp.root.style.visibility;
        const prevDisp = dp.root.style.display;

        dp.root.style.visibility = "hidden";
        dp.root.style.display = "block";

        const rect = dp.root.getBoundingClientRect();

        dp.root.style.visibility = prevVis;
        dp.root.style.display = prevDisp;

        return { w: rect.width, h: rect.height };
      }

      function parsePlacement(p) {
        const [side, align] = p.split("-");
        return { side, align }; // side: top/bottom, align: start/end
      }

      function choosePlacement(inputRect, popupSize) {
        // flip عمودی
        let placement = opt.placement;
        if (!opt.flip) return placement;

        const { side, align } = parsePlacement(opt.placement);

        const spaceBelow = win.innerHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;

        if (
          side === "bottom" &&
          spaceBelow < popupSize.h + opt.offset &&
          spaceAbove > spaceBelow
        ) {
          placement = `top-${align}`;
        } else if (
          side === "top" &&
          spaceAbove < popupSize.h + opt.offset &&
          spaceBelow > spaceAbove
        ) {
          placement = `bottom-${align}`;
        }

        return placement;
      }

      function computePosition() {
        const inputRect = dp.target.getBoundingClientRect();
        const dir = getDir();

        // ✅ اول عرض رو ست کن
        if (opt.matchWidth) {
            dp.root.style.width = `${inputRect.width}px`;
        } else {
            dp.root.style.width = "";
        }

        // ✅ بعد اندازه بگیر (حالا اندازه واقعی و نهایی است)
        const popupSize = measurePopup();

        const placement = choosePlacement(inputRect, popupSize);
        lastPlacement = placement;

        const { side, align } = parsePlacement(placement);
        const isRTL = dir === "rtl";

        let x;
        if (align === "start") {
            x = isRTL ? (inputRect.right - popupSize.w) : inputRect.left;
        } else {
            x = isRTL ? inputRect.left : (inputRect.right - popupSize.w);
        }

        let y;
        if (side === "bottom") y = inputRect.bottom + opt.offset;
        else y = inputRect.top - popupSize.h - opt.offset;

        const scrollX = win.scrollX || doc.documentElement.scrollLeft || 0;
        const scrollY = win.scrollY || doc.documentElement.scrollTop || 0;

        let left = x + scrollX;
        let top = y + scrollY;

        const minLeft = scrollX + 8;
        const maxLeft = scrollX + win.innerWidth - popupSize.w - 8;
        if (left < minLeft) left = minLeft;
        if (left > maxLeft) left = maxLeft;

        const minTop = scrollY + 8;
        const maxTop = scrollY + win.innerHeight - popupSize.h - 8;
        if (top < minTop) top = minTop;
        if (top > maxTop) top = maxTop;

        dp.root.style.left = `${left}px`;
        dp.root.style.top = `${top}px`;
    }


      function schedulePositionUpdate() {
        if (!isOpen) return;
        if (rafId) return;
        rafId = win.requestAnimationFrame(() => {
          rafId = null;
          computePosition();
        });
      }

      function open() {
        if (isOpen) return;
        isOpen = true;

        dp.root.style.display = "block";
        dp.root.style.visibility = "hidden";
        computePosition();
        dp.root.style.visibility = "visible";

        dp.root.dispatchEvent(
          new CustomEvent("rooz:open", { detail: { placement: lastPlacement } })
        );
      }

      function close() {
        if (!isOpen) return;
        isOpen = false;

        dp.root.style.display = "none";
        dp.root.dispatchEvent(new CustomEvent("rooz:close"));
      }

      function toggle() {
        isOpen ? close() : open();
      }

      // public helpers
      dp.open = open;
      dp.close = close;
      dp.toggle = toggle;

      const onInputFocus = () => open();
      const onInputClick = () => open();

      const onDocPointerDown = (e) => {
        if (!opt.closeOnOutsideClick) return;

        const t = e.target;

        // instance id را تضمین کن
        const id =
          dp._roozInstanceId ||
          dp.root.dataset.roozInstance ||
          (dp._roozInstanceId =
            globalThis.crypto?.randomUUID?.() ??
            `rooz_${Math.random().toString(16).slice(2)}_${Date.now()}`);

        dp.root.dataset.roozInstance = id;

        if (t.closest?.(`[data-rooz-instance="${id}"]`)) return;

        if (t === dp.target) return;

        if (dp.root.contains(t)) return;

        close();
      };

      // ESC
      const onKeyDown = (e) => {
        if (!opt.closeOnEsc) return;
        if (e.key === "Escape") close();
      };

      const offChange = dp.on("change", () => {
        if (opt.closeOnSelect) close();
      });

      const offRender = dp.on("render", () => schedulePositionUpdate());

      // scroll/resize
      const onResize = () => schedulePositionUpdate();
      const onScroll = () => schedulePositionUpdate();

      dp.target.addEventListener("focus", onInputFocus);
      dp.target.addEventListener("click", onInputClick);

      doc.addEventListener("pointerdown", onDocPointerDown, true);
      doc.addEventListener("keydown", onKeyDown, true);

      win.addEventListener("resize", onResize, { passive: true });
      win.addEventListener("scroll", onScroll, {
        passive: true,
        capture: true,
      });

      // اولین رندر
      dp.render();

      return () => {
        offChange();
        offRender();

        if (rafId) win.cancelAnimationFrame(rafId);

        dp.target.removeEventListener("focus", onInputFocus);
        dp.target.removeEventListener("click", onInputClick);

        doc.removeEventListener("pointerdown", onDocPointerDown, true);
        doc.removeEventListener("keydown", onKeyDown, true);

        win.removeEventListener("resize", onResize);
        win.removeEventListener("scroll", onScroll, true);

        // restore dom
        if (opt.portal && originalParent) {
          if (originalNext) originalParent.insertBefore(dp.root, originalNext);
          else originalParent.appendChild(dp.root);
        }

        delete dp.open;
        delete dp.close;
        delete dp.toggle;
      };
    },
  };
}
