import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) {
    throw badRequest('Activity input is required');
  }
  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !/^[\da-f]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[\da-f]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes < 1
  ) {
    throw badRequest('Activity requires valid userId, teamId, type, and minutes');
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }
  if (user.team?.toString() !== team._id.toString()) {
    throw badRequest('Activity user must belong to the specified team');
  }
  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!isRecord(_input)) {
    throw badRequest('Team input is required');
  }
  const { name, mascot } = _input;
  const members = _input.members ?? [];
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !/^[\da-f]{24}$/i.test(member))
  ) {
    throw badRequest('Team requires a name, mascot, and valid member IDs');
  }
  const users = members.length ? await User.find({ _id: { $in: members } }) : [];
  if (users.length !== members.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }
  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: users.map(({ _id }) => _id) });
  if (users.length) {
    const memberIds = users.map(({ _id }) => _id);
    const previousTeamIds = users.flatMap((user) => (user.team ? [user.team] : []));
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
    await Team.updateMany({ _id: { $in: previousTeamIds } }, { $pull: { members: { $in: memberIds } } });
  }
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $sort: { totalPoints: -1, 'team.name': 1 } },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }
  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goal = user.fitnessGoal.toLowerCase();
  const activityFocus = recentActivity?.type.toLowerCase() === 'strength'
    ? 'strength'
    : ['run', 'cycle', 'walk'].includes(recentActivity?.type.toLowerCase() ?? '')
      ? 'endurance'
      : recentActivity?.type.toLowerCase();
  const goalWorkouts = await Workout.find({ focus: goal }).lean();
  const focus = goalWorkouts.length ? goal : activityFocus ?? goal;
  const workouts = goalWorkouts.length ? goalWorkouts : await Workout.find({ focus }).lean();
  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your ${recentActivity?.type ?? user.fitnessGoal} activity and ${focus} focus`,
  }));
}

export { User };
