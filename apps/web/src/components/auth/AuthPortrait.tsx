import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ParticlePortrait } from "@/components/landing-experiment/ParticlePortrait";
import { photoCredits, portraits } from "@/components/landing-experiment/content";

export function AuthPortrait({ initialIndex }: { initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex);
  const portrait = portraits[index];
  const credit = photoCredits[index];
  return (
    <div className="auth-gallery">
      <div className="auth-portrait-image"><ParticlePortrait index={index} /></div>
      <div className="auth-gallery-bottom">
        <div className="auth-greeting" aria-live="polite" aria-atomic="true">
          <p lang={portrait.lang}>{portrait.word}</p>
          <span>{portrait.pronunciation} · {portrait.meaning}</span>
          <span>{portrait.language}</span>
        </div>
        <div className="auth-gallery-controls" aria-label="Explore the portraits">
          <button type="button" onClick={() => setIndex((index + portraits.length - 1) % portraits.length)} aria-label="Previous portrait"><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" onClick={() => setIndex((index + 1) % portraits.length)} aria-label="Next portrait"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
      <details className="auth-art-credit">
        <summary>About the portrait</summary>
        <p><a href={credit.url} target="_blank" rel="noreferrer">{credit.title}</a> by {credit.author} · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a>. Engraved interpretation for Fidel.</p>
      </details>
      <div className="auth-mobile-credit"><a href={credit.url} target="_blank" rel="noreferrer" aria-label={`${credit.title} by ${credit.author}`}>{credit.author}</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></div>
    </div>
  );
}
