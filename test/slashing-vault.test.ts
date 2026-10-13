import { describe, it, expect } from 'vitest';
import { SlashingVaultCalculator, DEFAULT_SLASHING_POLICY } from '../src/slashing-vault.js';

describe('SlashingVaultCalculator', () => {
  it('calculates 100% slashing penalty with 80/20 challenger reward split', () => {
    const calculator = new SlashingVaultCalculator();
    const stakeWei = 10_000n;

    const result = calculator.calculateSlashing(stakeWei);
    expect(result.totalSlashedWei).toBe(10_000n);
    expect(result.challengerRewardWei).toBe(8_000n);
    expect(result.burnedOrVaultFeeWei).toBe(2_000n);
    expect(result.collateralRemainingWei).toBe(0n);
  });

  it('supports partial slashing policies', () => {
    const calculator = new SlashingVaultCalculator({
      faultSlashingPercentageBps: 5000, // 50%
      challengerRewardPercentageBps: 9000, // 90% of slashed
      protocolFeePercentageBps: 1000, // 10% of slashed
    });

    const stakeWei = 20_000n;
    const result = calculator.calculateSlashing(stakeWei);

    expect(result.totalSlashedWei).toBe(10_000n);
    expect(result.challengerRewardWei).toBe(9_000n);
    expect(result.burnedOrVaultFeeWei).toBe(1_000n);
    expect(result.collateralRemainingWei).toBe(10_000n);
  });

  it('throws on non-positive stake', () => {
    const calculator = new SlashingVaultCalculator();
    expect(() => calculator.calculateSlashing(0n)).toThrow('Initial stake must be strictly positive');
  });
});
