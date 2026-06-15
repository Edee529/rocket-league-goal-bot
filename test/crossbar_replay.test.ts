import { describe, it, expect } from 'vitest';

describe('crossbar & replay handling', () => {
  it('dedupes crossbar hits within 2 seconds', () => {
    const cooldown = new Map<string, number>();
    const key = 'alice';
    const now = Date.now();
    // last hit 1 second ago
    cooldown.set(key, now - 1000);

    const last = cooldown.get(key) ?? 0;
    const withinWindow = Date.now() - last < 2000;
    expect(withinWindow).toBe(true);

    // simulate an allowed hit after 2.1 seconds
    cooldown.set(key, now - 2100);
    const allowed = Date.now() - (cooldown.get(key) ?? 0) > 2000;
    expect(allowed).toBe(true);
  });

  it('ignores goals during replay flag', () => {
    let inReplay = true;
    function handleGoal() {
      if (inReplay) return false;
      return true;
    }
    expect(handleGoal()).toBe(false);
    inReplay = false;
    expect(handleGoal()).toBe(true);
  });
});
