// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/**
 * @title KiteAgentDisputeArbiter
 * @author ellipticalisl
 * @notice Optimistic dispute arbitration and x402 collateral slashing vault on Kite Chain (EIP-155: 2368 / 2366).
 *         Permits autonomous agent networks to challenge malicious reasoning batches or non-delivery of tasks.
 */
contract KiteAgentDisputeArbiter {
    enum DisputeStatus {
        None,
        Active,
        ResolvedInFavorOfChallenger,
        Dismissed
    }

    struct DisputeRecord {
        bytes32 taskDigest;
        address agent;
        address challenger;
        uint256 stakeAmount;
        uint256 createdAt;
        uint256 challengePeriodEnd;
        DisputeStatus status;
        bytes32 x402ReceiptHash;
    }

    uint256 public immutable chainId;
    address public owner;
    uint256 public constant MIN_CHALLENGE_DURATION = 1 days;

    mapping(bytes32 => DisputeRecord) public disputes;

    event DisputeInitiated(
        bytes32 indexed disputeId,
        bytes32 indexed taskDigest,
        address indexed challenger,
        address agent,
        uint256 stakeAmount,
        uint256 challengePeriodEnd
    );

    event DisputeResolved(
        bytes32 indexed disputeId,
        DisputeStatus status,
        address slashedParty,
        uint256 slashedAmount
    );

    error DisputeAlreadyExists(bytes32 disputeId);
    error DisputeNotActive(bytes32 disputeId);
    error ChallengePeriodNotElapsed(uint256 current, uint256 required);
    error Unauthorized();
    error InsufficientStake();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        chainId = block.chainid;
    }

    function initiateDispute(
        bytes32 taskDigest,
        address agent,
        bytes32 x402ReceiptHash,
        uint256 challengeDuration
    ) external payable returns (bytes32 disputeId) {
        if (msg.value == 0) revert InsufficientStake();
        uint256 duration = challengeDuration < MIN_CHALLENGE_DURATION
            ? MIN_CHALLENGE_DURATION
            : challengeDuration;

        disputeId = keccak256(
            abi.encodePacked(taskDigest, agent, msg.sender, block.timestamp)
        );

        if (disputes[disputeId].createdAt != 0) {
            revert DisputeAlreadyExists(disputeId);
        }

        disputes[disputeId] = DisputeRecord({
            taskDigest: taskDigest,
            agent: agent,
            challenger: msg.sender,
            stakeAmount: msg.value,
            createdAt: block.timestamp,
            challengePeriodEnd: block.timestamp + duration,
            status: DisputeStatus.Active,
            x402ReceiptHash: x402ReceiptHash
        });

        emit DisputeInitiated(
            disputeId,
            taskDigest,
            msg.sender,
            agent,
            msg.value,
            block.timestamp + duration
        );
    }

    function resolveDispute(
        bytes32 disputeId,
        bool upholdChallenge
    ) external onlyOwner {
        DisputeRecord storage record = disputes[disputeId];
        if (record.status != DisputeStatus.Active) {
            revert DisputeNotActive(disputeId);
        }

        if (upholdChallenge) {
            record.status = DisputeStatus.ResolvedInFavorOfChallenger;
            uint256 reward = record.stakeAmount;
            (bool success, ) = payable(record.challenger).call{value: reward}("");
            require(success, "Transfer failed");

            emit DisputeResolved(
                disputeId,
                DisputeStatus.ResolvedInFavorOfChallenger,
                record.agent,
                reward
            );
        } else {
            record.status = DisputeStatus.Dismissed;
            emit DisputeResolved(
                disputeId,
                DisputeStatus.Dismissed,
                record.challenger,
                record.stakeAmount
            );
        }
    }
}
