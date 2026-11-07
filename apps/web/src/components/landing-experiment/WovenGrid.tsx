import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** A quiet textile, with a golden thread revealed by touch. */
export function WovenGrid() {
  const [paused, setPaused] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const spotlight = useRef<SVGCircleElement>(null);
  const branches = useRef<SVGPathElement>(null);
  const needle = useRef<SVGGElement>(null);
  const flowers = useRef<SVGRectElement>(null);
  const bloom = useRef<SVGGElement>(null);

  useEffect(() => {
    const host = svg.current?.parentElement;
    if (!host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let animation: Animation | undefined;
    let x = -300;
    let y = -300;
    let targetX = x;
    let targetY = y;

    function follow() {
      const direction = Math.atan2(targetY - y, targetX - x) * 180 / Math.PI;
      x += (targetX - x) * .14;
      y += (targetY - y) * .14;
      spotlight.current?.setAttribute("cx", String(x));
      spotlight.current?.setAttribute("cy", String(y));
      const knotX = Math.round((x - 120) / 240) * 240 + 120;
      const knotY = Math.round((y - 120) / 240) * 240 + 120;
      // The reveal follows the warp and weft, branching in four directions.
      branches.current?.setAttribute("d", `M${x} ${knotY}H${knotX}V${y} M${knotX - 360} ${knotY}h720 M${knotX} ${knotY - 360}v720`);
      needle.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${direction})`);
      flowers.current?.setAttribute("transform", `translate(${(x / innerWidth - .5) * 8} ${(y / innerHeight - .5) * 8})`);
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .5 ? requestAnimationFrame(follow) : 0;
    }
    function move(event: PointerEvent) {
      if (reduced.matches) return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (x < 0) { x = targetX; y = targetY; }
      svg.current?.classList.add("is-weaving");
      if (!frame) frame = requestAnimationFrame(follow);
    }
    function leave() {
      svg.current?.classList.remove("is-weaving");
      cancelAnimationFrame(frame);
      frame = 0;
      flowers.current?.removeAttribute("transform");
    }
    function tap(event: PointerEvent) {
      if (reduced.matches || event.button !== 0 || (event.target instanceof Element && event.target.closest("a,button,select,input,summary"))) return;
      move(event);
      const knotX = Math.round((event.clientX - 120) / 240) * 240 + 120;
      const knotY = Math.round((event.clientY - 120) / 240) * 240 + 120;
      bloom.current?.setAttribute("transform", `translate(${knotX} ${knotY})`);
      animation?.cancel();
      animation = bloom.current?.firstElementChild?.animate([
        { opacity: 0, transform: "scale(.35) rotate(-45deg)" },
        { opacity: .6, transform: "scale(1) rotate(0deg)", offset: .3 },
        { opacity: 0, transform: "scale(1.2) rotate(0deg)" },
      ], { duration: 1600, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerdown", tap, { passive: true });
    host.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", leave, { passive: true });
    reduced.addEventListener("change", leave);
    return () => {
      cancelAnimationFrame(frame);
      animation?.cancel();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", tap);
      host.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", leave);
      reduced.removeEventListener("change", leave);
    };
  }, []);

  return (
    <>
    <svg ref={svg} className={`editorial-woven-grid${paused ? " is-paused" : ""}`} width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="landing-weave-horizontal" y="114" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 6 0 12 6 6 12ZM12 6 18 0 24 6 18 12Z" />
          <path d="m3 6 3-3 3 3-3 3Zm12 0 3-3 3 3-3 3Z" />
        </pattern>
        <pattern id="landing-weave-vertical" x="114" width="12" height="24" patternUnits="userSpaceOnUse">
          <path d="M6 0 12 6 6 12 0 6ZM6 12 12 18 6 24 0 18Z" />
          <path d="m6 3 3 3-3 3-3-3Zm0 12 3 3-3 3-3-3Z" />
        </pattern>
        <pattern id="landing-woven-grid" width="240" height="240" patternUnits="userSpaceOnUse">
          <rect y="114" width="240" height="12" fill="url(#landing-weave-horizontal)" />
          <rect x="114" width="12" height="240" fill="url(#landing-weave-vertical)" />
          <path className="woven-grid-knot" d="m120 114 6 6-6 6-6-6Z" />
        </pattern>
        <pattern id="landing-woven-flowers" width="720" height="720" patternUnits="userSpaceOnUse" style={{ color: "var(--e-orange)" }}>
          <g transform="translate(120 120)"><path d="M0-20 10-10 0 0-10-10ZM20 0 10 10 0 0 10-10ZM0 20-10 10 0 0 10 10ZM-20 0-10-10 0 0-10 10Z" /></g>
          <g transform="translate(600 360)"><path d="m0-12 12 12L0 12-12 0Zm0-6L6 0 0 6-6 0Z" /></g>
        </pattern>
        <mask id="landing-woven-thread" style={{ maskType: "alpha" }}>
          <rect width="100%" height="100%" fill="url(#landing-woven-grid)" />
        </mask>
        <clipPath id="landing-thread-window">
          <circle ref={spotlight} cx="-500" cy="-500" r="230" />
          <path ref={branches} fill="none" stroke="white" strokeWidth="26" strokeLinecap="round" />
        </clipPath>
      </defs>
      <rect className="woven-grid-base" width="100%" height="100%" fill="url(#landing-woven-grid)" />
      <rect ref={flowers} className="woven-grid-flowers" width="100%" height="100%" fill="url(#landing-woven-flowers)" />
      <g mask="url(#landing-woven-thread)" className="woven-grid-current">
        <rect className="woven-current-across" width="180" height="100%" />
        <rect className="woven-current-down" width="100%" height="120" />
      </g>
      <g clipPath="url(#landing-thread-window)" className="woven-grid-thread">
        <rect width="100%" height="100%" fill="var(--e-orange)" mask="url(#landing-woven-thread)" />
      </g>
      <g ref={needle} className="woven-grid-needle" transform="translate(-300 -300)">
        <path d="m0-8 12 8L0 8-12 0Zm-23 4 4-4-4-4-4 4Zm-17-1 3-3-3-3-3 3Z" />
      </g>
      <g ref={bloom}><g className="woven-grid-bloom">
        <path d="M0-44 22-22 0 0-22-22ZM44 0 22 22 0 0 22-22ZM0 44-22 22 0 0 22 22ZM-44 0-22-22 0 0-22 22Z" />
        <path d="m0-22 22 22L0 22-22 0Zm0-9L9 0 0 9-9 0Z" />
      </g></g>
    </svg>
    <button type="button" className="editorial-weave-motion" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play woven background motion" : "Pause woven background motion"} aria-pressed={paused} title={paused ? "Play background motion" : "Pause background motion"}>
      {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}<span>Background motion</span>
    </button>
    </>
  );
}
