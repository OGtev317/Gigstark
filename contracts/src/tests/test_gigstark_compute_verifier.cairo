use snforge_std::signature::stark_curve::{
    StarkCurveKeyPair, StarkCurveKeyPairImpl, StarkCurveSignerImpl,
};
use snforge_std::{ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp};
use starknet::{ContractAddress, SyscallResultTrait};
use starkware_utils_testing::test_utils::{assert_panic_with_felt_error, cheat_caller_address_once};
use super::super::compute_verifier::{
    COMPUTE_OUTCOME_BUYER, GigstarkComputeReceipt, IGigstarkComputeVerifierDispatcher,
    IGigstarkComputeVerifierDispatcherTrait, IGigstarkComputeVerifierSafeDispatcher,
    IGigstarkComputeVerifierSafeDispatcherTrait, errors,
};

const ADMIN: felt252 = 'COMPUTE_ADMIN';
const AUDIENCE: felt252 = 'ESCROW_AUDIENCE';
const POLICY_ID: felt252 = 'COMPUTE_POLICY';
const PROGRAM_MEASUREMENT: felt252 = 'ENCLAVE_IMAGE_V1';
const COMPUTE_POLICY_HASH: felt252 = 'DISPUTE_POLICY_V1';
const JOB_ID: felt252 = 'ESCROW_DISPUTE_1';
const INPUT_COMMITMENT: felt252 = 'BOUND_ESCROW_INPUT';
const POLICY_START: u64 = 900;
const POLICY_END: u64 = 1_200;
const NOW: u64 = 1_000;
const STARK_CURVE_ORDER: felt252 =
    0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f;
const STARK_CURVE_HALF_ORDER: felt252 =
    0x4000000000000087fffffffffffffffdbc08936e573d9190f335120d6e32697;

#[derive(Copy, Drop)]
struct ComputeContext {
    verifier_address: ContractAddress,
    tee_attestor: StarkCurveKeyPair,
    zk_verifier: StarkCurveKeyPair,
}

#[generate_trait]
impl ComputeContextImpl of ComputeContextTrait {
    fn verifier(self: @ComputeContext) -> IGigstarkComputeVerifierDispatcher {
        IGigstarkComputeVerifierDispatcher { contract_address: *self.verifier_address }
    }

    #[feature("safe_dispatcher")]
    fn safe_verifier(self: @ComputeContext) -> IGigstarkComputeVerifierSafeDispatcher {
        IGigstarkComputeVerifierSafeDispatcher { contract_address: *self.verifier_address }
    }

    fn signed_receipt(self: @ComputeContext, scope_nullifier: felt252) -> GigstarkComputeReceipt {
        let mut receipt = GigstarkComputeReceipt {
            policy_id: POLICY_ID,
            audience: audience(),
            job_id: JOB_ID,
            input_commitment: INPUT_COMMITMENT,
            evidence_commitment: 'PRIVATE_EVIDENCE_HASH',
            result_commitment: 'COMPUTE_RESULT_HASH',
            outcome: COMPUTE_OUTCOME_BUYER,
            attestation_commitment: 'NITRO_QUOTE_HASH',
            proof_commitment: 'ZK_PROOF_HASH',
            scope_nullifier,
            issued_at: NOW - 1,
            expires_at: NOW + 50,
            tee_signature_r: 0,
            tee_signature_s: 0,
            zk_signature_r: 0,
            zk_signature_s: 0,
        };
        let digest = self.verifier().get_result_digest(receipt);
        let (tee_r, tee_s) = self.tee_attestor.sign(digest).unwrap();
        let (zk_r, zk_s) = self.zk_verifier.sign(digest).unwrap();
        receipt.tee_signature_r = tee_r;
        receipt.tee_signature_s = canonical_s(tee_s);
        receipt.zk_signature_r = zk_r;
        receipt.zk_signature_s = canonical_s(zk_s);
        receipt
    }

    fn consume(self: @ComputeContext, receipt: GigstarkComputeReceipt) -> u8 {
        cheat_caller_address_once(
            contract_address: *self.verifier_address, caller_address: audience(),
        );
        self.verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt)
    }
}

fn setup() -> ComputeContext {
    let tee_attestor = StarkCurveKeyPairImpl::from_secret_key('TEE_ATTESTOR_SECRET');
    let zk_verifier = StarkCurveKeyPairImpl::from_secret_key('ZK_VERIFIER_SECRET');
    let verifier_class = declare(contract: "GigstarkComputeVerifier")
        .unwrap_syscall()
        .contract_class();
    let (verifier_address, _) = verifier_class.deploy(@array![ADMIN]).unwrap_syscall();
    let verifier = IGigstarkComputeVerifierDispatcher { contract_address: verifier_address };
    cheat_caller_address_once(
        contract_address: verifier_address, caller_address: ADMIN.try_into().unwrap(),
    );
    verifier
        .set_policy(
            POLICY_ID,
            audience(),
            PROGRAM_MEASUREMENT,
            COMPUTE_POLICY_HASH,
            POLICY_START,
            POLICY_END,
            tee_attestor.public_key,
            zk_verifier.public_key,
        );
    start_cheat_block_timestamp(verifier_address, NOW);
    ComputeContext { verifier_address, tee_attestor, zk_verifier }
}

fn audience() -> ContractAddress {
    AUDIENCE.try_into().unwrap()
}

fn canonical_s(signature_s: felt252) -> felt252 {
    let signature_s_u256: u256 = signature_s.into();
    let half_order_u256: u256 = STARK_CURVE_HALF_ORDER.into();
    if signature_s_u256 > half_order_u256 {
        STARK_CURVE_ORDER - signature_s
    } else {
        signature_s
    }
}

#[test]
fn test_dual_attestation_result_is_consumed_once() {
    let context = setup();
    let receipt = context.signed_receipt('COMPUTE_ONCE');
    assert_eq!(context.consume(receipt), COMPUTE_OUTCOME_BUYER);
    assert(context.verifier().is_nullifier_used(POLICY_ID, 'COMPUTE_ONCE'), 'NULLIFIER_UNUSED');
}

#[test]
#[feature("safe_dispatcher")]
fn test_compute_nullifier_replay_fails() {
    let context = setup();
    let receipt = context.signed_receipt('COMPUTE_REPLAY');
    context.consume(receipt);
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let replay = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(replay, errors::NULLIFIER_USED);
}

#[test]
#[feature("safe_dispatcher")]
fn test_bad_tee_signature_fails() {
    let context = setup();
    let mut receipt = context.signed_receipt('BAD_TEE_SIG');
    receipt.tee_signature_r += 1;
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let result = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(result, errors::INVALID_TEE_SIGNATURE);
}

#[test]
#[feature("safe_dispatcher")]
fn test_bad_zk_signature_fails() {
    let context = setup();
    let mut receipt = context.signed_receipt('BAD_ZK_SIG');
    receipt.zk_signature_r += 1;
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let result = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(result, errors::INVALID_ZK_SIGNATURE);
}

#[test]
#[feature("safe_dispatcher")]
fn test_wrong_job_and_input_are_rejected_before_consumption() {
    let context = setup();
    let receipt = context.signed_receipt('WRONG_JOB_INPUT');
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let wrong_job = context
        .safe_verifier()
        .consume_result('ANOTHER_JOB', INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(wrong_job, errors::JOB_MISMATCH);
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let wrong_input = context.safe_verifier().consume_result(JOB_ID, 'OTHER_INPUT', receipt);
    assert_panic_with_felt_error(wrong_input, errors::INPUT_MISMATCH);
}

#[test]
#[feature("safe_dispatcher")]
fn test_revoked_compute_policy_fails() {
    let context = setup();
    let receipt = context.signed_receipt('REVOKED_COMPUTE');
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: ADMIN.try_into().unwrap(),
    );
    context.verifier().set_policy_active(POLICY_ID, false);
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let result = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(result, errors::POLICY_INACTIVE);
}

#[test]
#[feature("safe_dispatcher")]
fn test_expired_compute_receipt_fails() {
    let context = setup();
    let mut receipt = context.signed_receipt('EXPIRED_COMPUTE');
    receipt.expires_at = NOW;
    cheat_caller_address_once(
        contract_address: context.verifier_address, caller_address: audience(),
    );
    let result = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(result, errors::RECEIPT_EXPIRED);
}

#[test]
#[feature("safe_dispatcher")]
fn test_wrong_compute_audience_fails() {
    let context = setup();
    let receipt = context.signed_receipt('WRONG_COMPUTE_AUDIENCE');
    cheat_caller_address_once(
        contract_address: context.verifier_address,
        caller_address: 'ANOTHER_AUDIENCE'.try_into().unwrap(),
    );
    let result = context.safe_verifier().consume_result(JOB_ID, INPUT_COMMITMENT, receipt);
    assert_panic_with_felt_error(result, errors::AUDIENCE_MISMATCH);
}
