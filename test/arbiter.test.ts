import { describe, it, expect } from 'vitest';
import { KiteDisputeArbiterClient } from '../src/arbiter-client.js';

describe('KiteDisputeArbiterClient', () => {
  it('computes deterministic keccak256 dispute digest', () => {
    const taskDigest = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const agent = '0x2222222222222222222222222222222222222222';
    const challenger = '0x3333333333333333333333333333333333333333';
    const timestamp = 1718000000n;

    const id1 = KiteDisputeArbiterClient.computeDisputeId(taskDigest, agent, challenger, timestamp);
    const id2 = KiteDisputeArbiterClient.computeDisputeId(taskDigest, agent, challenger, timestamp);

    expect(id1).toBe(id2);
    expect(id1.startsWith('0x')).toBe(true);
    expect(id1.length).toBe(66);
  });

  it('accurately verifies challenge expiration bounds', () => {
    expect(KiteDisputeArbiterClient.isChallengeExpired(1000, 2000)).toBe(false);
    expect(KiteDisputeArbiterClient.isChallengeExpired(2000, 2000)).toBe(true);
    expect(KiteDisputeArbiterClient.isChallengeExpired(2500, 2000)).toBe(true);
  });
});
