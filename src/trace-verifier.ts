import { type Hex, hexToBytes, toHex } from 'viem';

export interface AuditLogEntry {
  stepIndex: number;
  actionDigest: Hex;
  resultHash: Hex;
  timestamp: number;
}

/**
 * Validates cryptographic execution traces provided during challenge disputes
 */
export class AgentExecutionTraceVerifier {
  public static verifyTraceContinuity(entries: AuditLogEntry[]): {
    valid: boolean;
    error?: string;
  } {
    if (entries.length === 0) {
      return { valid: false, error: 'Trace entries list cannot be empty' };
    }

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].stepIndex !== i) {
        return {
          valid: false,
          error: `Non-sequential step index detected at position ${i}: expected ${i}, found ${entries[i].stepIndex}`,
        };
      }
      if (i > 0 && entries[i].timestamp < entries[i - 1].timestamp) {
        return {
          valid: false,
          error: `Temporal inversion detected at step ${i}: timestamp ${entries[i].timestamp} < ${entries[i - 1].timestamp}`,
        };
      }
    }

    return { valid: true };
  }
}
