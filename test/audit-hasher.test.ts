import { describe, it, expect } from 'vitest';
import { AuditTrailHasher, TraceStep } from '../src/audit-hasher.js';
import { Hex } from 'viem';

describe('AuditTrailHasher', () => {
  const step0: TraceStep = {
    stepIndex: 0,
    actionType: 'prompt_ingest',
    payloadDigest: '0x1111111111111111111111111111111111111111111111111111111111111111',
  };

  const step1: TraceStep = {
    stepIndex: 1,
    actionType: 'reasoning_evaluation',
    payloadDigest: '0x2222222222222222222222222222222222222222222222222222222222222222',
  };

  it('computes empty trace zero hash', () => {
    expect(AuditTrailHasher.computeChainedHash([])).toBe('0x' + '0'.repeat(64));
  });

  it('computes deterministic chained hash across steps', () => {
    const hash1 = AuditTrailHasher.computeChainedHash([step0, step1]);
    const hash2 = AuditTrailHasher.computeChainedHash([step0, step1]);
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('0x')).toBe(true);
  });

  it('verifies step inclusion inside verified trace', () => {
    const all = [step0, step1];
    const chained = AuditTrailHasher.computeChainedHash(all);
    expect(AuditTrailHasher.verifyInclusion(step0, chained, all)).toBe(true);

    const tamperedStep: TraceStep = {
      stepIndex: 0,
      actionType: 'tampered',
      payloadDigest: '0x3333333333333333333333333333333333333333333333333333333333333333',
    };
    expect(AuditTrailHasher.verifyInclusion(tamperedStep, chained, all)).toBe(false);
  });
});
