import { type Hex, isHex } from 'viem';

export interface SlashingPolicy {
  faultSlashingPercentageBps: number; // Basis points: 5000 = 50%, 10000 = 100%
  challengerRewardPercentageBps: number; // Percentage of slashed funds awarded to whistleblower
  protocolFeePercentageBps: number;
}

export interface SlashingExecutionResult {
  totalSlashedWei: bigint;
  challengerRewardWei: bigint;
  burnedOrVaultFeeWei: bigint;
  collateralRemainingWei: bigint;
}

export const DEFAULT_SLASHING_POLICY: SlashingPolicy = {
  faultSlashingPercentageBps: 10000, // 100% slash for proven malicious violation
  challengerRewardPercentageBps: 8000, // 80% to challenger bounty
  protocolFeePercentageBps: 2000, // 20% protocol insurance reserve
};

/**
 * SlashingVaultCalculator
 * Computes deterministic penalty disbursements and challenger rewards for adjudicated disputes
 */
export class SlashingVaultCalculator {
  private policy: SlashingPolicy;

  constructor(policy: SlashingPolicy = DEFAULT_SLASHING_POLICY) {
    if (policy.challengerRewardPercentageBps + policy.protocolFeePercentageBps !== 10000) {
      throw new Error('Challenger reward and protocol fee must sum to 10000 basis points');
    }
    this.policy = policy;
  }

  public calculateSlashing(initialStakeWei: bigint): SlashingExecutionResult {
    if (initialStakeWei <= 0n) {
      throw new Error('Initial stake must be strictly positive');
    }

    const totalSlashedWei = (initialStakeWei * BigInt(this.policy.faultSlashingPercentageBps)) / 10000n;
    const challengerRewardWei = (totalSlashedWei * BigInt(this.policy.challengerRewardPercentageBps)) / 10000n;
    const burnedOrVaultFeeWei = totalSlashedWei - challengerRewardWei;
    const collateralRemainingWei = initialStakeWei - totalSlashedWei;

    return {
      totalSlashedWei,
      challengerRewardWei,
      burnedOrVaultFeeWei,
      collateralRemainingWei,
    };
  }
}
