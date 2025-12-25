export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === false || v === null || v === undefined) continue;
    else node.setAttribute(k, String(v));
  }
  for (const ch of children) node.append(ch);
  return node;
}

export function isInput(elm) {
  return elm && (elm.tagName === "INPUT" || elm.tagName === "TEXTAREA");
}
