"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design width and scales them down to the available width,
 * so the product preview reads like a screenshot at every breakpoint with no horizontal scroll.
 */
export function ScaleToFit({
  designWidth,
  children,
  className
}: {
  designWidth: number;
  children: ReactNode;
  className?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const scale = Math.min(1, o.clientWidth / designWidth);
      setBox({ scale, height: i.offsetHeight * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={outer}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        height: box ? box.height : undefined,
        aspectRatio: box ? undefined : `${designWidth} / 455`
      }}
    >
      <div
        ref={inner}
        style={{
          width: designWidth,
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "top left",
          transform: `scale(${box?.scale ?? 0})`,
          visibility: box ? "visible" : "hidden"
        }}
      >
        {children}
      </div>
    </div>
  );
}
