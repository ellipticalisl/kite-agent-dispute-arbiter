import { describe, it, expect } from 'vitest';
import { AgentExecutionTraceVerifier, AuditLogEntry } from '../src/trace-verifier.js';
import { type Hex } from 'viem';

describe('AgentExecutionTraceVerifier', () => {
  it('validates strictly ordered and monotonic execution traces', () => {
    const validTrace: AuditLogEntry[] = [
      {
        stepIndex: 0,
        actionDigest: '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex,
        resultHash: '0x2222222222222222222222222222222222222222222222222222222222222222' as Hex,
        timestamp: 1000,
      },
      {
        stepIndex: 1,
        actionDigest: '0x3333333333333333333333333333333333333333333333333333333333333333' as Hex,
        resultHash: '0x4444444444444444444444444444444444444444444444444444444444444444' as Hex,
        timestamp: 1050,
      },
    ];

    expect(AgentExecutionTraceVerifier.verifyTraceContinuity(validTrace).valid).toBe(true);
  });

  it('rejects out-of-order execution step sequence', () => {
    const invalidTrace: AuditLogEntry[] = [
      {
        stepIndex: 0,
        actionDigest: '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex,
        resultHash: '0x2222222222222222222222222222222222222222222222222222222222222222' as Hex,
        timestamp: 1000,
      },
      {
        stepIndex: 3, // gap detected
        actionDigest: '0x3333333333333333333333333333333333333333333333333333333333333333' as Hex,
        resultHash: '0x4444444444444444444444444444444444444444444444444444444444444444' as Hex,
        timestamp: 1050,
      },
    ];

    const res = AgentExecutionTraceVerifier.verifyTraceContinuity(invalidTrace);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Non-sequential step index');
  });
});
