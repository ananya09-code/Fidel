import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import map from "./map-data.json";
import { regions } from "./content";

const names = [...new Set(regions.map(region => region.languages[0]))];
const tone = (name: string) => names.indexOf(name) % 5;

export function LanguageAtlas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const triggers = useRef(new Map<string, SVGGElement>());
  const selected = regions.find(region => region.id === selectedId);
  const location = map.regions.find(region => region.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    close.current?.focus({ preventScroll: true });
    function dismiss(event: PointerEvent) {
      if (stage.current && !stage.current.contains(event.target as Node)) setSelectedId(null);
    }
    document.addEventListener("pointerdown",dismiss);
    return () => document.removeEventListener("pointerdown",dismiss);
  }, [selectedId]);

  function dismiss() {
    setSelectedId(null);
    if(selectedId) triggers.current.get(selectedId)?.focus({preventScroll:true});
  }

  return <section id="atlas" className="editorial-atlas editorial-section" aria-labelledby="atlas-heading">
    <div className="editorial-section-intro"><h2 id="atlas-heading">A country of voices</h2><p>Select a place. Discover the languages that make it home.</p></div>
    <div ref={stage} className="atlas-popup-stage" onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();dismiss();}}}>
      <div className="atlas-popup-toolbar"><p>Ethiopia’s languages</p><label className="sr-only" htmlFor="atlas-region-select">Choose a region</label>
        <select id="atlas-region-select" value={selectedId??""} onChange={event=>setSelectedId(event.target.value||null)}><option value="">Choose a region</option>{[...regions].sort((a,b)=>a.name.localeCompare(b.name)).map(region=><option key={region.id} value={region.id}>{region.name}</option>)}</select>
      </div>
      <div className="atlas-popup-map" data-ui="Interactive geographic map">
        <svg viewBox="0 0 600 520" role="group" aria-label="Ethiopia: select a region">
          {map.regions.map(shape=>{
            return <g key={shape.id} aria-hidden="true" className={`atlas-region ${selectedId===shape.id?"is-selected":""}`} onClick={()=>setSelectedId(shape.id)}><path d={shape.path} fillRule="evenodd" /></g>;
          })}
          {map.regions.map(shape=>{
            const region=regions.find(region=>region.id===shape.id)!;
            return <g key={shape.id} className={`atlas-language-dot language-tone-${tone(region.languages[0])} ${selectedId===shape.id?"is-selected":""}`}><g ref={element=>{if(element)triggers.current.set(shape.id,element);else triggers.current.delete(shape.id);}} role="button" tabIndex={0} aria-label={region.name} aria-haspopup="dialog" aria-expanded={selectedId===shape.id} onClick={()=>setSelectedId(shape.id)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setSelectedId(shape.id);}}}><circle className="atlas-dot-halo" cx={shape.center[0]} cy={shape.center[1]} r="15" /><circle className="atlas-dot-core" cx={shape.center[0]} cy={shape.center[1]} r="5" /></g>{["ET01","ET02","ET03","ET04","ET05"].includes(shape.id)&&<text aria-hidden="true" x={shape.center[0]} y={shape.center[1]-23} textAnchor="middle">{region.languages[0]}</text>}</g>;
          })}
        </svg>
        {selected&&location&&<div role="dialog" aria-modal="false" aria-label={`Languages in ${selected.name}`} className={`atlas-language-popup ${location.center[1]<190?"popup-below":""}`} style={{left:`${Math.max(26,Math.min(74,location.center[0]/6))}%`,top:`${location.center[1]/5.2}%`}}>
          <button ref={close} type="button" className="atlas-popup-close" aria-label="Close language popup" onClick={dismiss}><X size={18} /></button><h3>{selected.name}</h3><p lang="am">{selected.native}</p><p className="atlas-popup-label">Languages spoken here include</p><ul>{selected.languages.map(language=><li key={language}>{language}</li>)}</ul>
        </div>}
      </div>
      <div className="atlas-popup-key"><span><i /> Select a language dot</span><span>12 regions and two city administrations</span></div>
    </div>
    <p className="editorial-map-note">Regions are multilingual. These examples are not linguistic boundaries. <a href="https://data.humdata.org/dataset/cod-ab-eth" target="_blank" rel="noreferrer">Map source: OCHA/HDX.</a></p>
  </section>;
}
