import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { portraits } from "./content";
import { ParticlePortrait } from "./ParticlePortrait";

export function PortraitStage() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (stage.current) observer.observe(stage.current);
    const timer = window.setInterval(() => {
      if (!paused && !reduced.matches && !document.hidden && visible) setActive(index => (index + 1) % portraits.length);
    }, 5000);
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, [paused, active]);

  const portrait = portraits[active];

  return (
    <div className="editorial-portrait-stage" ref={stage}>
      <div className="editorial-portraits">
        <ParticlePortrait index={active} />
        <div key={active} className="editorial-word-float word-float-om" aria-label={`${portrait.language}: ${portrait.pronunciation}, ${portrait.meaning}`}>
          <strong lang={portrait.lang}>{portrait.word}</strong><span>{portrait.pronunciation}</span><span>{portrait.meaning}</span><span className="portrait-word-language"><i />{portrait.language}</span>
        </div>
      </div>
      <div className="editorial-portrait-controls">
        <div className={`portrait-progress ${paused ? "is-paused" : ""}`} aria-label="Choose a portrait">
          {portraits.map((item,index)=><button type="button" key={item.src} aria-label={`Show portrait ${index+1}`} aria-pressed={active===index} onClick={()=>setActive(index)}><span key={`${active}-${index}`} /></button>)}
        </div>
        <div>
          <button type="button" aria-label={paused ? "Play portrait slideshow" : "Pause portrait slideshow"} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button>
        </div>
      </div>
    </div>
  );
}
