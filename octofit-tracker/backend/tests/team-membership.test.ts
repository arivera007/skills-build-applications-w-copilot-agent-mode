import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Activity, Team, User } from '../src/models/index.js';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60_000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await Promise.all([Activity.deleteMany({}), Team.deleteMany({}), User.deleteMany({})]);
});

describe('team membership consistency', () => {
  it('moves members to a new team and lets them log activity for it', async () => {
    const previousTeam = await Team.create({ name: 'Previous', mascot: 'Hubot', members: [] });
    const moved = await User.create({ name: 'Mona', email: 'mona@example.com', team: previousTeam._id, fitnessGoal: 'endurance' });
    const unassigned = await User.create({ name: 'Hubot', email: 'hubot@example.com', fitnessGoal: 'strength' });
    await Team.updateOne({ _id: previousTeam._id }, { $addToSet: { members: moved._id } });

    const created = await request(app).post('/api/teams').send({ name: 'Octocats', mascot: 'Mona', members: [moved._id.toString(), unassigned._id.toString()] });
    expect(created.status).toBe(201);
    const newTeamId = created.body.team._id as string;

    expect((await User.findById(moved._id))?.team?.toString()).toBe(newTeamId);
    expect((await User.findById(unassigned._id))?.team?.toString()).toBe(newTeamId);
    expect((await Team.findById(previousTeam._id))?.members.map(String)).not.toContain(moved._id.toString());

    const activity = await request(app).post('/api/activities').send({ userId: moved._id.toString(), teamId: newTeamId, type: 'run', minutes: 20 });
    expect(activity.status).toBe(201);
  });

  it('leaves unrelated teams and users untouched', async () => {
    const other = await Team.create({ name: 'Other', mascot: 'Copilot', members: [] });
    const bystander = await User.create({ name: 'Bystander', email: 'bystander@example.com', team: other._id, fitnessGoal: 'mobility' });
    await Team.updateOne({ _id: other._id }, { $addToSet: { members: bystander._id } });

    const created = await request(app).post('/api/teams').send({ name: 'Empty', mascot: 'Mona' });
    expect(created.status).toBe(201);
    expect((await User.findById(bystander._id))?.team?.toString()).toBe(other._id.toString());
    expect((await Team.findById(other._id))?.members.map(String)).toContain(bystander._id.toString());
  });
});
