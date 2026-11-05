import { getJson } from '../api/client.js';
import { useAsyncList } from '../hooks/useAsyncList.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const state = useAsyncList<LeaderboardEntry>(async () => (await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')).leaderboard);
  return <CapabilityCard<LeaderboardEntry>
    {...state}
    title="Leaderboard"
    description="Compare team point totals."
    emptyMessage="No leaderboard rankings yet."
    renderItem={(entry) => `#${entry.rank} ${entry.teamName}: ${entry.totalPoints} points`}
  />;
}
