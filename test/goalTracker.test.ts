import { describe, it, expect } from 'vitest';
import { isFunnySpeed, isNearMiss, checkMilestone, isGoalThief, processGoal } from '../src/goalTracker';

describe('goalTracker', () => {
  it('recognizes funny speeds (rounded to 69)', () => {
    expect(isFunnySpeed(processGoal('Alice', 68.6))).toBe(true);
    // 69.4 rounds to 69 and should be considered funny; 69.6 rounds to 70 and should not
    expect(isFunnySpeed(processGoal('Bob', 69.4))).toBe(true);
    expect(isFunnySpeed(processGoal('Carl', 69.6))).toBe(false);
  });

  it('detects near misses (within 1 kp/h but not exact)', () => {
    expect(isNearMiss(processGoal('Alice', 68.1))).toBe(true);
    expect(isNearMiss(processGoal('Alice', 69.9))).toBe(true);
    expect(isNearMiss(processGoal('A', 69))).toBe(false);
  });

  it('returns milestone only for listed values', () => {
    expect(checkMilestone(10)).toBe(10);
    expect(checkMilestone(11)).toBe(null);
  });

  it('detects goal thieves correctly', () => {
    expect(isGoalThief(processGoal('A', 69, 'B'))).toBe(true);
    expect(isGoalThief(processGoal('A', 69))).toBe(false);
  });

  it('processGoal defaults missing scorer to Unknown and formats speed label', () => {
    const g = processGoal(undefined, 70);
    expect(g.scorerName).toBe('Unknown');
    expect(g.goalSpeedLabel).toBe('70');
  });
});
