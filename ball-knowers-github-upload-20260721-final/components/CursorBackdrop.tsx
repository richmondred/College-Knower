"use client";

import { useEffect } from "react";

export function CursorBackdrop() {
  useEffect(() => {
    const root = document.documentElement;

    function moveSpotlight(event: PointerEvent) {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
      root.dataset.pointerReady = "true";
    }

    window.addEventListener("pointermove", moveSpotlight, { passive: true });

    return () => {
      window.removeEventListener("pointermove", moveSpotlight);
      delete root.dataset.pointerReady;
    };
  }, []);

  return null;
}
