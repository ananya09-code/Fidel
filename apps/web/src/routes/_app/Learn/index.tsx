import { createFileRoute, Link } from "@tanstack/react-router";
import { LearningPath } from "@/components/learn-ui/LearningPath";

export const Route = createFileRoute("/_app/Learn/")({ component: LearnPage });

function LearnPage() {
  return <div className="fidel-learn"><LearningPath /><Link to="/quest" className="learn-quest-entry"><span><strong>Fidel Quest</strong><span>Try a little adventure with the words you know.</span></span><span>Explore the village →</span></Link></div>;
}
