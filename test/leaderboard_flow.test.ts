import { describe, it, expect } from 'vitest';
import { checkMilestone, buildMilestoneEmbed } from '../src/goalTracker';

describe('leaderboard flows', () => {
  it('triggers milestone at 10 and builds correct embed', () => {
    const player = 'Alice';
    const key = player.toLowerCase();
    // simulate leaderboard map
    const leaderboard = new Map<string, number>();
    leaderboard.set(key, 9);

    // increment
    const newCount = (leaderboard.get(key) ?? 0) + 1;
    leaderboard.set(key, newCount);

    const milestone = checkMilestone(newCount);
    expect(milestone).toBe(10);

    const embed = buildMilestoneEmbed(player, milestone!, newCount).toJSON();
    expect(embed.title).toContain('DOUBLE DIGITS');
    expect(embed.fields.some((f: any) => f.name.includes('Total'))).toBe(true);
  });

  it('does not trigger milestone for non-milestone counts', () => {
    expect(checkMilestone(11)).toBeNull();
  });
});
