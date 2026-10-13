import { describe, it, expect } from 'vitest';
import { ChallengeLifecycleManager } from '../src/lifecycle.js';
import { Hex } from 'viem';

describe('ChallengeLifecycleManager', () => {
  const disputeId: Hex = '0x1111111111111111111111111111111111111111111111111111111111111111';
  const agent: Hex = '0x2222222222222222222222222222222222222222';
  const challenger: Hex = '0x3333333333333333333333333333333333333333';

  it('registers and transitions challenge session lifecycle', () => {
    const manager = new ChallengeLifecycleManager();
    const now = 1_000_000;

    manager.registerSession({
      disputeId,
      agentAddress: agent,
      challengerAddress: challenger,
      stakeAmountWei: 1000n,
      startTime: now,
      durationSeconds: 3600,
    });

    const session = manager.getSession(disputeId);
    expect(session?.status).toBe('PROPOSED');

    manager.advanceStatus(disputeId, 'CHALLENGED', now + 100);
    expect(manager.getSession(disputeId)?.status).toBe('CHALLENGED');

    manager.advanceStatus(disputeId, 'EVALUATED_UPHELD', now + 200);
    expect(manager.getSession(disputeId)?.status).toBe('EVALUATED_UPHELD');
  });

  it('marks challenge session as expired when window lapses', () => {
    const manager = new ChallengeLifecycleManager();
    const now = 1_000_000;

    manager.registerSession({
      disputeId,
      agentAddress: agent,
      challengerAddress: challenger,
      stakeAmountWei: 1000n,
      startTime: now,
      durationSeconds: 3600,
    });

    // Advance after 3601 seconds
    const expired = manager.advanceStatus(disputeId, 'PROPOSED', now + 3601 * 1000);
    expect(expired.status).toBe('EXPIRED');
  });
});
