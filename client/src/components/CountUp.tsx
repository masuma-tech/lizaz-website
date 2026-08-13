import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  value: string;
  className?: string;
  durationMs?: number;
};

type ParsedValue =
  | { kind: "number"; target: number; prefix: string; suffix: string; useCommas: boolean }
  | { kind: "range"; start: number; end: number; separator: string }
  | { kind: "static"; text: string };

function parseValue(raw: string): ParsedValue {
  const value = raw.trim();

  const rangeMatch = value.match(/^(\d+)\s*([–—-])\s*(\d+)(.*)$/);
  if (rangeMatch) {
    return {
      kind: "range",
      start: Number(rangeMatch[1]),
      end: Number(rangeMatch[3]),
      separator: `${rangeMatch[2]}${rangeMatch[4] ?? ""}`,
    };
  }

  const kMatch = value.match(/^(\d+(?:\.\d+)?)\s*([kK])(\+?)$/);
  if (kMatch) {
    return {
      kind: "number",
      target: Number(kMatch[1]),
      prefix: "",
      suffix: `${kMatch[2].toUpperCase()}${kMatch[3]}`,
      useCommas: false,
    };
  }

  const numMatch = value.match(/^([^0-9]*)(\d{1,3}(?:,\d{3})*|\d+)(.*)$/);
  if (numMatch) {
    return {
      kind: "number",
      target: Number(numMatch[2].replace(/,/g, "")),
      prefix: numMatch[1],
      suffix: numMatch[3],
      useCommas: numMatch[2].includes(","),
    };
  }

  return { kind: "static", text: value };
}

function formatNumber(n: number, useCommas: boolean) {
  const rounded = Math.round(n);
  return useCommas ? rounded.toLocaleString("en-US") : String(rounded);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function initialDisplay(parsed: ParsedValue) {
  if (parsed.kind === "static") return parsed.text;
  if (parsed.kind === "range") return `0${parsed.separator}0`;
  return `${parsed.prefix}0${parsed.suffix}`;
}

export function CountUp({ value, className, durationMs = 1600 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => initialDisplay(parseValue(value)));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const parsed = parseValue(value);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || parsed.kind === "static") {
      setDisplay(value);
      return;
    }

    setDisplay(initialDisplay(parsed));

    let frameId = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        const eased = easeOutCubic(progress);

        if (parsed.kind === "range") {
          setDisplay(
            `${formatNumber(parsed.start * eased, false)}${parsed.separator}${formatNumber(parsed.end * eased, false)}`,
          );
        } else {
          setDisplay(
            `${parsed.prefix}${formatNumber(parsed.target * eased, parsed.useCommas)}${parsed.suffix}`,
          );
        }

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          setDisplay(value);
        }
      };

      frameId = requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
