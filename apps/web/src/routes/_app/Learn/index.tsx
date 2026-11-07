import { createFileRoute } from "@tanstack/react-router";
import { LearningPath } from "@/components/learn-ui/LearningPath";

export const Route = createFileRoute("/_app/Learn/")({ component: LearnPage });

function LearnPage() {
  return <div className="fidel-learn"><LearningPath /></div>;
}
