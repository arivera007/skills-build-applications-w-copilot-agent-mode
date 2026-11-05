import { getJson } from '../api/client.js';
import { useAsyncList } from '../hooks/useAsyncList.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const state = useAsyncList<Activity>(async () => (await getJson<{ activities: Activity[] }>('/api/activities')).activities);
  return <CapabilityCard<Activity>
    {...state}
    title="Activities"
    description="Track student activity minutes and points."
    emptyMessage="No activities yet."
    renderItem={(activity) => `${activity.type}: ${activity.minutes} minutes, ${activity.points} points`}
  />;
}
