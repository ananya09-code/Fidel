import { PageState } from "@/components/common-ui/PageState";
import { StudyActivityCalendar } from "@/components/profile-ui/StudyActivityCalendar";
import { useStudyActivity } from "@/hooks/use-dashboard";

export function StudyActivitySection() {
  const activity = useStudyActivity();
  if (activity.isPending) return <PageState compact kind="loading" title="Loading study activity" />;
  if (activity.isError) return (
    <PageState compact kind="error" title="Couldn't load study activity"
      description={activity.error.message} actionLabel="Try again" onAction={() => void activity.refetch()} />
  );
  return <StudyActivityCalendar key={`${activity.data.start_date}-${activity.data.timezone}`} activity={activity.data} />;
}
