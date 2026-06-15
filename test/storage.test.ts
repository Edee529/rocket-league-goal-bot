import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';
import { loadData, saveData, StoredData } from '../src/storage';

const DATA_FILE = join(__dirname, '..', 'leaderboard.json');
const BACKUP = DATA_FILE + '.bak';

describe('storage normalization', () => {
  beforeAll(() => {
    // backup existing data if present
    if (existsSync(DATA_FILE)) {
      if (existsSync(BACKUP)) unlinkSync(BACKUP);
      renameSync(DATA_FILE, BACKUP);
    }
  });

  afterAll(() => {
    // restore backup
    if (existsSync(DATA_FILE)) unlinkSync(DATA_FILE);
    if (existsSync(BACKUP)) renameSync(BACKUP, DATA_FILE);
  });

  it('loads legacy mixed-case leaderboard and normalizes keys', () => {
    const sample = {
      leaderboard: {
        "Alice": 2,
        "alice": 3,
        "BOB": 1
      },
      crossbarHits: {
        "Alice": 1,
        "BOB": 2
      },
      announcedMilestones: {
        "Alice": [10],
        "Bob": [25]
      },
      displayNames: { "Alice": "Alice" }
    };

    writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2), 'utf-8');

    const data: StoredData = loadData();

    expect(data.leaderboard['alice']).toBe(5);
    expect(data.leaderboard['bob']).toBe(1);
    expect(data.crossbarHits['alice']).toBe(1);
    expect(data.crossbarHits['bob']).toBe(2);
    expect(data.displayNames['alice']).toBe('Alice');
  });

  it('saveData writes displayNames and leaderboard back to file', () => {
    const payload: StoredData = {
      leaderboard: { 'charlie': 3 },
      crossbarHits: { 'charlie': 1 },
      announcedMilestones: { 'charlie': [10] },
      recent: ['charlie — 69 kp/h'],
      season: 42,
      displayNames: { 'charlie': 'Charlie' }
    };

    saveData(payload);

    const raw = readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.displayNames?.charlie).toBe('Charlie');
    expect(parsed.leaderboard?.charlie).toBe(3);
  });
});
