import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowDown, ArrowUpRight, Moon, Sun } from "lucide-react";
import { useThemePreview } from "@/components/theme/ThemeProvider";
import { PortraitStage } from "./PortraitStage";
import { FidelWordmark } from "./FidelWordmark";
import { LanguageAtlas } from "./LanguageAtlas";
import { LanguageDeck } from "./LanguageDeck";
import { photoCredits } from "./content";
import "./landing.css";

export function EditorialLanding() {
  const { isSignedIn } = useAuth();
  const previewTheme = useThemePreview();
  const start = isSignedIn ? "/Home" : "/sign-up";


  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    previewTheme(next);
  }

  return (
    <div className="fidel-editorial">
      <a className="editorial-skip" href="#landing-main">Skip to content</a>
      <header className="editorial-header">
        <Link to="/" aria-label="Fidel home" className="editorial-wordmark"><FidelWordmark /></Link>
        <nav aria-label="Landing page"><a href="#practice">How it works</a><a href="#languages">Languages</a><a href="#atlas">Explore Ethiopia</a></nav>
        <div className="editorial-header-actions">
          <button type="button" className="editorial-theme-toggle" onClick={toggleTheme} aria-label="Toggle light and dark appearance" title="Preview light or dark appearance">
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

        <section id="practice" className="editorial-practice editorial-section" aria-labelledby="practice-heading">
          <div className="editorial-section-intro">
            <h2 id="practice-heading">Learn it, say it, keep it.</h2>
            <p className="editorial-reveal">Begin with a greeting. Listen, then take it into your next conversation.</p>
          </div>
          <div className="editorial-learning-methods">
            <article className="editorial-reveal"><h3>Learn</h3><p>See words in their own script, understand their meaning in English and Amharic, and listen when a reviewed recording is available.</p></article>
            <article className="editorial-reveal"><h3>Practise</h3><p>Explore flashcards and answer practice questions. Save your progress and pick up where you left off.</p></article>
            <article className="editorial-reveal"><h3>Review</h3><p>Return to words that need another look. Keep track of learned words and build a daily habit that lasts.</p></article>
          </div>
        </section>

        <LanguageDeck start={start} />

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
