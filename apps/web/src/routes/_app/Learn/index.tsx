import { createFileRoute, Link } from "@tanstack/react-router";
import { LearningPath } from "@/components/learn-ui/LearningPath";
import { SentenceBuilder } from "@/components/learn-ui/SentenceBuilder";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_app/Learn/")({ component: LearnPage });

function LearnPage() {
  return <div className="fidel-learn">
    <Link to="/quest" className="learn-quest-feature" aria-label="Explore Fidel Quest village conversations">
      <span className="learn-quest-feature-copy">
        <span className="learn-quest-kicker">Fidel Quest</span>
        <strong>The village is waiting.</strong>
        <span className="learn-quest-description">Use the words you’ve learned in short conversations. Each new word opens another door.</span>
        <span className="learn-quest-direction">Explore the village <ArrowUpRight size={18} aria-hidden="true" /></span>
      </span>
      <svg className="learn-quest-landscape" viewBox="0 0 360 190" fill="none" aria-hidden="true">
        <path className="learn-quest-horizon" d="M0 143c50-35 85-38 134-10 44 25 81 16 119-11 43-31 76-24 107-1" />
        <path className="learn-quest-trail" d="M126 190c4-24 34-37 76-41 56-6 59-24 47-43" />
        <path className="learn-quest-roof" d="m208 94 42-39 44 39" />
        <path className="learn-quest-house" d="M216 92v51h69V92M243 143v-29h17v29M269 106h11v12h-11" />
        <path className="learn-quest-roof learn-quest-roof-small" d="m69 126 28-25 29 25" />
        <path className="learn-quest-house" d="M75 124v32h45v-32M91 156v-19h13v19" />
        <path className="learn-quest-tree" d="M322 145V81m-24 35 24-39 23 39m-40-18 17-31 16 31M157 146V95m-19 31 19-34 19 34m-32-19 13-27 13 27" />
        <circle className="learn-quest-sun" cx="252" cy="35" r="10" />
      </svg>
    </Link>
    <LearningPath />
    <SentenceBuilder />
  </div>;
}
