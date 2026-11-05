import { getJson } from '../api/client.js';
import { useAsyncList } from '../hooks/useAsyncList.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const state = useAsyncList<Team>(async () => (await getJson<{ teams: Team[] }>('/api/teams')).teams);
  return <CapabilityCard<Team>
    {...state}
    title="Teams"
    description="Manage teams and members."
    emptyMessage="No teams yet."
    renderItem={(team) => `${team.name} (${team.members.length} members)`}
  />;
}
