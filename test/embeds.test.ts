import { describe, it, expect } from 'vitest';
import {
  processGoal,
  buildGoalEmbed,
  buildWrongModeEmbed,
  buildMilestoneEmbed,
  buildStreakEmbed,
  buildThiefEmbed,
  buildNearMissEmbed,
  buildLeaderboardEmbed,
  buildCompareEmbed,
  buildRivalryEmbed,
  buildSessionEmbed,
  buildCrossbarEmbed,
} from '../src/goalTracker';

describe('embed builders', () => {
  it('buildGoalEmbed contains title, scorer and speed', () => {
    const g = processGoal('Alice', 69, 'Bob');
    const embed = buildGoalEmbed(g).toJSON();
    expect(embed.title).toBeDefined();
    expect(embed.title).toContain('69');
    expect(embed.description).toContain('Alice');
    expect(embed.fields.some((f: any) => f.name.includes('Scorer'))).toBe(true);
  });

  it('buildWrongModeEmbed returns NOT COUNTED title', () => {
    const g = processGoal('Alice', 68);
    const embed = buildWrongModeEmbed(g).toJSON();
    expect(embed.title).toContain('NOT COUNTED');
  });

  it('buildMilestoneEmbed includes milestone title and total', () => {
    const embed = buildMilestoneEmbed('Alice', 10, 10).toJSON();
    expect(embed.title).toContain('DOUBLE DIGITS');
    expect(embed.fields.some((f: any) => f.name.includes('Total'))).toBe(true);
  });

  it('buildStreakEmbed contains streak count and player', () => {
    const embed = buildStreakEmbed('Alice', 3).toJSON();
    expect(embed.title).toContain('STREAK');
    expect(embed.description).toContain('Alice');
  });

  it('buildThiefEmbed mentions both scorer and victim', () => {
    const embed = buildThiefEmbed('Scorer', 'Victim').toJSON();
    expect(embed.title).toContain('GOAL THIEF');
    expect(embed.description).toContain('Scorer');
    expect(embed.description).toContain('Victim');
  });

  it('buildNearMissEmbed contains player and speed', () => {
    const embed = buildNearMissEmbed('Alice', '68.5').toJSON();
    expect(embed.title).toContain('SO CLOSE');
    expect(embed.description).toContain('Alice');
    expect(embed.description).toContain('68.5');
  });

  it('buildLeaderboardEmbed formats entries', () => {
    const entries = [['Alice', 5], ['Bob', 3]] as [string, number][];
    const embed = buildLeaderboardEmbed(entries, 1, 8).toJSON();
    expect(embed.title).toContain('LEADERBOARD');
    expect(embed.description).toContain('Alice');
    expect(embed.fields.some((f: any) => f.name.includes('Season'))).toBe(true);
  });

  it('buildCompareEmbed handles <2 players gracefully', () => {
    const res = buildCompareEmbed([], {}, {}).toJSON();
    expect(res.title).toContain('HEAD TO HEAD');
  });

  it('buildRivalryEmbed handles single player as solo', () => {
    const res = buildRivalryEmbed([['Solo', 1]], 1).toJSON();
    expect(res.title).toContain('SOLO RIVALRY');
  });

  it('buildSessionEmbed and buildCrossbarEmbed produce valid objects', () => {
    const session = buildSessionEmbed({ Alice: 2 }, { Alice: 2 }, 1, '1m 2s').toJSON();
    expect(session.title).toContain('SESSION');
    const cross = buildCrossbarEmbed([['Alice', 3]], 1, 3).toJSON();
    expect(cross.title).toContain('CROSSBAR');
  });
});
