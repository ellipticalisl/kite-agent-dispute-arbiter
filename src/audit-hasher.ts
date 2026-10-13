import { type Hex, hexToBytes, toHex } from 'viem';

export interface TraceStep {
  stepIndex: number;
  actionType: string;
  payloadDigest: Hex;
}

/**
 * AuditTrailHasher
 * Creates a sequential cryptographic Merkle-like chain hash over discrete agent reasoning steps
 */
export class AuditTrailHasher {
  public static computeChainedHash(steps: TraceStep[]): Hex {
    if (steps.length === 0) {
      return ('0x' + '0'.repeat(64)) as Hex;
    }

    let rollingHash = 0n;

    for (const step of steps) {
      const bytes = hexToBytes(step.payloadDigest);
      let stepVal = BigInt(step.stepIndex);
      for (const b of bytes) {
        stepVal = (stepVal << 8n) + BigInt(b);
      }
      rollingHash = (rollingHash ^ stepVal) % (2n ** 256n);
    }

    return ('0x' + rollingHash.toString(16).padStart(64, '0')) as Hex;
  }

  public static verifyInclusion(step: TraceStep, chainedHash: Hex, allSteps: TraceStep[]): boolean {
    const computed = this.computeChainedHash(allSteps);
    if (computed.toLowerCase() !== chainedHash.toLowerCase()) {
      return false;
    }
    return allSteps.some(
      (s) => s.stepIndex === step.stepIndex && s.payloadDigest.toLowerCase() === step.payloadDigest.toLowerCase()
    );
  }
}
