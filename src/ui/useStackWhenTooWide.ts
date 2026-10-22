import { useLayoutEffect, useRef } from "react";

// Lays a row out side by side when it fits; when its content is wider than
// the row, adds `stackedClass` so CSS can stack it. Measured from the actual
// content, so it holds for any scene or type, at any width.
export function useStackWhenTooWide<T extends HTMLElement>(stackedClass: string, dep: unknown) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;
    let width = -1;
    const fit = () => {
      if (row.clientWidth === width) return;
      width = row.clientWidth;
      row.classList.remove(stackedClass);
      if (row.scrollWidth > row.clientWidth + 1) row.classList.add(stackedClass);
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(row);
    return () => observer.disconnect();
  }, [stackedClass, dep]);
  return ref;
}
