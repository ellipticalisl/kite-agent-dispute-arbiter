import { type Hex, encodePacked, keccak256 } from 'viem';
import { z } from 'zod';

export const DisputeProposalSchema = z.object({
  taskDigest: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  challengerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  stakeAmountWei: z.bigint().positive(),
  challengeDurationSec: z.number().int().min(3600),
  x402ReceiptHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export type DisputeProposal = z.infer<typeof DisputeProposalSchema>;

export class KiteDisputeArbiterClient {
  public static computeDisputeId(
    taskDigest: Hex,
    agent: Hex,
    challenger: Hex,
    timestamp: bigint
  ): Hex {
    return keccak256(
      encodePacked(
        ['bytes32', 'address', 'address', 'uint256'],
        [taskDigest, agent, challenger, timestamp]
      )
    );
  }

  public static isChallengeExpired(currentTimestamp: number, challengePeriodEnd: number): boolean {
    return currentTimestamp >= challengePeriodEnd;
  }
}
