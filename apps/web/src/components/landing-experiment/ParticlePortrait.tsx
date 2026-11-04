import { useEffect, useRef } from "react";
import { portraits } from "./content";

type Stroke = { x: number; y: number; ox: number; oy: number; tx: number; ty: number; light: number; edge: number; fade: number; textile: boolean };

/** Licensed photography, sampled into horizontal ink strokes. No WebGL or animation library. */
export function ParticlePortrait({ index }: { index: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const previous = useRef<Stroke[]>([]);

  useEffect(() => {
    const target = canvas.current;
    const context = target?.getContext("2d");
    if (!target || !context) return;
    const width = 600, height = 700;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stopped = false, frame = 0;
    let redraw = () => {};
    const themeObserver = new MutationObserver(() => redraw());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const motionChange = () => redraw();
    reduced.addEventListener("change", motionChange);
    const image = new Image();
    image.onload = () => {
      if (stopped) return;
      target.width = width; target.height = height;
      const sample = document.createElement("canvas");
      sample.width = width; sample.height = height;
      const sampling = sample.getContext("2d", { willReadFrequently: true });
      if (!sampling) return;
      const portrait = portraits[index];
      const [cx, cy, cw, ch] = portrait.crop;
      // Authored silhouettes remove distracting backgrounds without changing a person's features.
      sampling.beginPath();
      portrait.outline.forEach(([x,y],i) => {
        const px = (x-cx)/cw*width, py = (y-cy)/ch*height;
        if(i===0) sampling.moveTo(px,py); else sampling.lineTo(px,py);
      });
      sampling.closePath(); sampling.clip();
      sampling.drawImage(image,cx,cy,cw,ch,0,0,width,height);
      const pixels = sampling.getImageData(0,0,width,height).data;
      const points: Stroke[] = [];
      for(let y=4;y<height-4;y+=3) for(let x=4;x<width-4;x+=5.5) {
        const i=(Math.floor(y)*width+Math.floor(x))*4;
        if(pixels[i+3]<200) continue;
        const r=pixels[i], g=pixels[i+1], b=pixels[i+2];
        const light=(.2126*r+.7152*g+.0722*b)/255;
        const noise=Math.sin(x*127.1+y*311.7)*43758.5453;
        const jitter=noise-Math.floor(noise);
        // Keep faces in ink and translate saturated textiles into the brand's orange.
        const saturated=Math.max(r,g,b)-Math.min(r,g,b)>Math.max(55,Math.max(r,g,b)*.6);
        const textile=saturated && y>height*.48;
        const neighbour=i+width*8;
        const edge=Math.min(1,Math.abs(light-(.2126*pixels[neighbour]+.7152*pixels[neighbour+1]+.0722*pixels[neighbour+2])/255)*3);
        const fade=Math.min(1,(height-y)/65,y/22);
        const tx=x+(jitter-.5)*1.7, ty=y+(jitter-.5)*.8;
        const old=previous.current[points.length % (previous.current.length||1)];
        const angle=jitter*Math.PI*2;
        points.push({x:old?.x??tx,y:old?.y??ty,ox:old?.x??width/2+Math.cos(angle)*300,oy:old?.y??height/2+Math.sin(angle)*330,tx,ty,light,edge,fade,textile});
      }
      previous.current=points;
      let started: number | null = null;
      let last = 0;
      const paint = (time: number) => {
        if(stopped) return;
        if(started===null) started=time;
        const progress=reduced.matches?1:Math.min(1,(time-started)/1650);
        if(time-last>30 || progress===1 || last===0) {
          const style=getComputedStyle(target);
          const ink=style.getPropertyValue("--particle-ink").trim();
          const orange=style.getPropertyValue("--particle-orange").trim();
          const dark=document.documentElement.classList.contains("dark");
          context.clearRect(0,0,width,height);
          const blend=progress*progress*(3-2*progress);
          // Preserve facial midtones on light paper; hatching alone washed them out.
          if (!dark) {
            context.save();
            context.globalAlpha=.58*blend;
            context.filter="grayscale(1) contrast(1.25)";
            context.drawImage(sample,0,0);
            context.restore();
          }
          for(const point of points) {
            point.x=point.ox+(point.tx-point.ox)*blend;
            point.y=point.oy+(point.ty-point.oy)*blend;
            // Light paper needs denser dark hatching, not pale original RGB colours.
            const tone=dark?Math.pow(point.light,.85):Math.min(1,Math.pow(1-point.light,1.1)+point.edge*.16);
            const density=point.textile?Math.max(.55,tone):tone;
            const strokeWidth=.8+density*4.5;
            context.globalAlpha=(point.textile?.95:(.16+Math.pow(density,.7)*.7))*point.fade;
            context.fillStyle=point.textile?orange:ink;
            context.fillRect(point.x-strokeWidth/2,point.y,strokeWidth,dark?1.5:1.9);
          }
          context.globalAlpha=1; last=time;
        }
        if(progress<1) frame=requestAnimationFrame(paint);
      };
      // Once formed, the engraving rests: no ambient wobble or off-screen animation loop.
      redraw=()=>{cancelAnimationFrame(frame);paint(performance.now());};
      frame=requestAnimationFrame(paint);
    };
    image.src=portraits[index].src;
    return () => {stopped=true;cancelAnimationFrame(frame);themeObserver.disconnect();reduced.removeEventListener("change",motionChange);image.onload=null;};
  },[index]);

  return <div className="particle-portrait">
    <span className="sr-only" role="img" aria-label={portraits[index].alt} />
    <noscript><img src={portraits[index].src} alt={portraits[index].alt} width="600" height="700" className="particle-photo-fallback" /></noscript>
    <canvas ref={canvas} aria-hidden="true" />
  </div>;
}
