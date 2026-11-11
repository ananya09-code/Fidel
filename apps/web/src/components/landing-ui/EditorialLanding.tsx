import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowDown, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useAppearanceChoice } from "@/components/theme/ThemeProvider";
import { PortraitStage } from "./PortraitStage";
import { WovenGrid } from "./WovenGrid";
import { FidelWordmark } from "./FidelWordmark";
import { LanguageAtlas } from "./LanguageAtlas";
import { LanguageDeck } from "./LanguageDeck";
import { LessonPreview } from "./LessonPreview";
import { photoCredits } from "./content";
import { InstallFidel, useFidelInstalled } from "@/components/install/InstallFidel";
import "./landing.css";

export function EditorialLanding() {
  const { isSignedIn } = useAuth();
  const chooseTheme = useAppearanceChoice();
  const installed = useFidelInstalled();
  const start = isSignedIn ? "/Home" : "/sign-up";


  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    chooseTheme(next);
  }

  return (
    <div className="fidel-editorial">
      <WovenGrid />
      <a className="editorial-skip" href="#landing-main">Skip to content</a>
      <header className="editorial-header">
        <Link to="/" aria-label="Fidel home" className="editorial-wordmark"><FidelWordmark /></Link>
        <nav aria-label="Landing page"><a href="#practice">How it works</a><a href="#languages">Languages</a><a href="#atlas">Explore Ethiopia</a></nav>
        <div className="editorial-header-actions">
          <button type="button" className="editorial-theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark appearance" title="Switch light or dark appearance">
            <Moon className="editorial-light-icon" size={21} aria-hidden="true" /><Sun className="editorial-dark-icon" size={21} aria-hidden="true" />
          </button>
          <Link to={isSignedIn ? "/Home" : "/sign-in"}>{isSignedIn ? "Go to dashboard" : "Log in"}</Link>
        </div>
      </header>

      <main id="landing-main">
        <section className="editorial-hero" aria-labelledby="hero-title">
          <div className="editorial-hero-copy">
            <h1 id="hero-title">Ethiopia,<br />word by word.</h1>
            <p>Learn Ethiopia’s languages through short daily lessons, native recordings and words worth coming back to.</p>
            <Link className="editorial-primary" to={start}>Start your first lesson <ArrowUpRight size={23} aria-hidden="true" /></Link>
            <a className="editorial-hero-explore" href="#atlas">Explore Ethiopia <ArrowDown size={20} aria-hidden="true" /></a>
          </div>
          <PortraitStage />
        </section>

        <LanguageAtlas />

        <LessonPreview />

        <LanguageDeck start={start} />

        {!installed && <section className="editorial-install" aria-labelledby="install-heading">
          <div><h2 id="install-heading">A place on your home screen.</h2><p>Keep Fidel close on your phone or computer. Learning still needs an internet connection.</p></div>
          <InstallFidel buttonClassName="editorial-install-button" />
        </section>}

        <section className="editorial-close" aria-labelledby="close-heading">
          <div className="editorial-close-copy">
            <h2 id="close-heading">A little closer<br />to your roots.</h2>
            <p>Start with a greeting. Make room for a daily connection.</p>
            <Link className="editorial-primary" to={start}>Start learning free <ArrowUpRight size={23} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <div className="editorial-weave" aria-hidden="true"><svg width="100%" height="24"><defs><pattern id="fidel-tibeb" width="48" height="24" patternUnits="userSpaceOnUse"><path d="M0 12 12 0 24 12 12 24ZM24 12 36 0 48 12 36 24Z" fill="none" stroke="currentColor" strokeWidth="3"/><path d="m6 12 6-6 6 6-6 6Zm24 0 6-6 6 6-6 6Z" fill="currentColor"/></pattern></defs><rect width="100%" height="24" fill="url(#fidel-tibeb)"/></svg></div>
      <footer className="editorial-footer">
        <div className="editorial-footer-main"><Link to="/" aria-label="Fidel home" className="editorial-wordmark"><FidelWordmark /></Link><p>Ethiopian languages. Everyday connections.</p><a href="#hero-title">Back to the beginning</a></div>
        <details className="editorial-credits">
          <summary>Photography & map credits</summary>
          <ul>{photoCredits.map(credit => <li key={credit.url}><a href={credit.url} target="_blank" rel="noreferrer">{credit.title}</a> by {credit.author}. <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a>. Cropped and adapted into stroke engravings with textile colour. Each adaptation retains its source licence.</li>)}</ul>
          <p>Administrative boundaries: OCHA/HDX, CC BY-IGO; simplified for display. <a href="https://github.com/HabtamuTesafaye/ethiopia-geo-boundaries" target="_blank" rel="noreferrer">GeoJSON mirror</a>. Merriweather and Noto Serif Ethiopic: SIL Open Font License.</p>
          <p>Regional language descriptions are illustrative. Courses and recorded word previews currently use Afaan Oromoo and Amharic.</p>
        </details>
      </footer>
    </div>
  );
}
