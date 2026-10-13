import { type Hex, isHex } from 'viem';

export type ChallengeLifecycleStatus = 'PROPOSED' | 'CHALLENGED' | 'EVALUATED_UPHELD' | 'EVALUATED_DISMISSED' | 'EXPIRED';

export interface ChallengeSession {
  disputeId: Hex;
  agentAddress: Hex;
  challengerAddress: Hex;
  stakeAmountWei: bigint;
  startTime: number;
  durationSeconds: number;
  status: ChallengeLifecycleStatus;
}

/**
 * ChallengeLifecycleManager
 * Manages states, timeouts, and state transitions of contested multi-agent task deliveries
 */
export class ChallengeLifecycleManager {
  private sessions: Map<string, ChallengeSession> = new Map();

  public registerSession(session: Omit<ChallengeSession, 'status'>): ChallengeSession {
    if (!isHex(session.disputeId) || session.disputeId.length !== 66) {
      throw new Error(`Invalid disputeId: ${session.disputeId}`);
    }

    const key = session.disputeId.toLowerCase();
    const created: ChallengeSession = {
      ...session,
      status: 'PROPOSED',
    };
    this.sessions.set(key, created);
    return created;
  }

  public advanceStatus(disputeId: Hex, newStatus: ChallengeLifecycleStatus, now: number = Date.now()): ChallengeSession {
    const key = disputeId.toLowerCase();
    const existing = this.sessions.get(key);
    if (!existing) {
      throw new Error(`Session not found for disputeId ${disputeId}`);
    }

    const expirationTime = existing.startTime + existing.durationSeconds * 1000;
    if (now >= expirationTime && existing.status === 'PROPOSED') {
      existing.status = 'EXPIRED';
      return existing;
    }

    existing.status = newStatus;
    return existing;
  }

  public getSession(disputeId: Hex): ChallengeSession | undefined {
    return this.sessions.get(disputeId.toLowerCase());
  }
}
