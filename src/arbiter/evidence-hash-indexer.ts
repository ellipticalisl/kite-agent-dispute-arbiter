import crypto from 'crypto';

export interface DisputeEvidenceBundle {
  disputeId: string;
  submitter: string;
  payloadDigest: string;
  submittedAt: number;
}

export class EvidenceHashIndexer {
  private registry = new Map<string, DisputeEvidenceBundle[]>();

  public indexEvidence(disputeId: string, submitter: string, rawPayload: Buffer): DisputeEvidenceBundle {
    const hash = crypto.createHash('sha256').update(rawPayload).digest('hex');
    const bundle: DisputeEvidenceBundle = {
      disputeId,
      submitter,
      payloadDigest: `0x${hash}`,
      submittedAt: Date.now(),
    };

    const existing = this.registry.get(disputeId) || [];
    existing.push(bundle);
    this.registry.set(disputeId, existing);
    return bundle;
  }
}
