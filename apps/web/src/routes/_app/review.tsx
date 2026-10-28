
import { createFileRoute } from "@tanstack/react-router";
import { ReviewOverview } from "@/components/learn-ui/review/ReviewOverview";

export const Route = createFileRoute("/_app/review")({
  component: ReviewPage,
});

function ReviewPage() {
  return (
    <ReviewOverview
      onStartReview={(words) => {
        console.log("Start review:", words);
      }}
      onReviewCategory={(category, words) => {
        console.log("Review category:", category, words);
      }}
      onViewAllWords={() => {
        console.log("View all review words");
      }}
    />
  );
}

