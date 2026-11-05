import { getJson } from '../api/client.js';
import { useAsyncList } from '../hooks/useAsyncList.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason: string };

const seededUserEmail = 'mona@example.com';

export default function Workouts() {
  const state = useAsyncList<WorkoutSuggestion>(async () => (
    await getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(seededUserEmail)}`)
  ).suggestions);
  return <CapabilityCard<WorkoutSuggestion>
    {...state}
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    emptyMessage="No workout suggestions yet."
    renderItem={(suggestion) => <>{suggestion.title}: {suggestion.reason}</>}
  />;
}
