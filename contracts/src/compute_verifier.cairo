//! Hybrid TEE + ZK verifiable-compute receipt verifier for Gigstark.
//!
//! Both policy-pinned Stark keys sign the same result statement. The TEE key
//! represents an enclave key or attestation gateway key bound to a reviewed
//! hardware measurement. The ZK key represents a verifier that accepted the
//! proof commitment. This contract does not parse vendor quote certificate
//! chains and does not directly verify the underlying ZK proof yet.

use starknet::ContractAddress;

pub const COMPUTE_RECEIPT_DOMAIN: felt252 = 'GIGSTARK_COMPUTE_V1';
pub const COMPUTE_NULLIFIER_DOMAIN: felt252 = 'GIG_COMPUTE_NULL_V1';
pub const COMPUTE_OUTCOME_BUYER: u8 = 1;
pub const COMPUTE_OUTCOME_SELLER: u8 = 2;

const STARK_CURVE_ORDER: felt252 =
    0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f;
const STARK_CURVE_HALF_ORDER: felt252 =
    0x4000000000000087fffffffffffffffdbc08936e573d9190f335120d6e32697;

#[derive(Copy, Drop, Serde, starknet::Store)]
pub struct GigstarkComputePolicy {
    pub audience: ContractAddress,
    pub program_measurement: felt252,
    pub compute_policy_hash: felt252,
    pub valid_from: u64,
    pub valid_until: u64,
    pub tee_attestor_public_key: felt252,
    pub zk_verifier_public_key: felt252,
    pub active: bool,
}

#[derive(Copy, Drop, Serde)]
pub struct GigstarkComputeReceipt {
    pub policy_id: felt252,
    pub audience: ContractAddress,
    pub job_id: felt252,
    pub input_commitment: felt252,
    pub evidence_commitment: felt252,
    pub result_commitment: felt252,
    pub outcome: u8,
    pub attestation_commitment: felt252,
    pub proof_commitment: felt252,
    pub scope_nullifier: felt252,
    pub issued_at: u64,
    pub expires_at: u64,
    pub tee_signature_r: felt252,
    pub tee_signature_s: felt252,
    pub zk_signature_r: felt252,
    pub zk_signature_s: felt252,
}

#[starknet::interface]
pub trait IGigstarkComputeVerifier<TContractState> {
    fn get_admin(self: @TContractState) -> ContractAddress;
    fn get_policy(self: @TContractState, policy_id: felt252) -> GigstarkComputePolicy;
    fn is_nullifier_used(
        self: @TContractState, policy_id: felt252, scope_nullifier: felt252,
    ) -> bool;
    fn get_result_digest(self: @TContractState, receipt: GigstarkComputeReceipt) -> felt252;
    fn consume_result(
        ref self: TContractState,
        expected_job_id: felt252,
        expected_input_commitment: felt252,
        receipt: GigstarkComputeReceipt,
    ) -> u8;
    fn set_policy(
        ref self: TContractState,
        policy_id: felt252,
        audience: ContractAddress,
        program_measurement: felt252,
        compute_policy_hash: felt252,
        valid_from: u64,
        valid_until: u64,
        tee_attestor_public_key: felt252,
        zk_verifier_public_key: felt252,
    );
    fn set_policy_active(ref self: TContractState, policy_id: felt252, active: bool);
}

pub mod errors {
    pub const ZERO_ADMIN: felt252 = 'COMPUTE_ZERO_ADMIN';
    pub const ONLY_ADMIN: felt252 = 'COMPUTE_ONLY_ADMIN';
    pub const INVALID_POLICY: felt252 = 'COMPUTE_BAD_POLICY';
    pub const SAME_AUTHORITY: felt252 = 'COMPUTE_SAME_AUTH';
    pub const POLICY_INACTIVE: felt252 = 'COMPUTE_INACTIVE';
    pub const POLICY_EXPIRED: felt252 = 'COMPUTE_POLICY_TIME';
    pub const AUDIENCE_MISMATCH: felt252 = 'COMPUTE_AUDIENCE';
    pub const INVALID_RECEIPT: felt252 = 'COMPUTE_BAD_RECEIPT';
    pub const RECEIPT_EXPIRED: felt252 = 'COMPUTE_RECEIPT_TIME';
    pub const JOB_MISMATCH: felt252 = 'COMPUTE_JOB';
    pub const INPUT_MISMATCH: felt252 = 'COMPUTE_INPUT';
    pub const NULLIFIER_USED: felt252 = 'COMPUTE_REPLAY';
    pub const INVALID_TEE_SIGNATURE: felt252 = 'COMPUTE_BAD_TEE_SIG';
    pub const INVALID_ZK_SIGNATURE: felt252 = 'COMPUTE_BAD_ZK_SIG';
}

#[starknet::contract]
pub mod GigstarkComputeVerifier {
    use core::ecdsa::check_ecdsa_signature;
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, get_block_timestamp, get_caller_address, get_contract_address, get_tx_info,
    };
    use super::{
        COMPUTE_NULLIFIER_DOMAIN, COMPUTE_OUTCOME_BUYER, COMPUTE_OUTCOME_SELLER,
        COMPUTE_RECEIPT_DOMAIN, GigstarkComputePolicy, GigstarkComputeReceipt,
        IGigstarkComputeVerifier, STARK_CURVE_HALF_ORDER, STARK_CURVE_ORDER, errors,
    };

    #[storage]
    struct Storage {
        admin: ContractAddress,
        policies: starknet::storage::Map<felt252, GigstarkComputePolicy>,
        used_nullifiers: starknet::storage::Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PolicyConfigured: PolicyConfigured,
        PolicyStatusChanged: PolicyStatusChanged,
        ResultConsumed: ResultConsumed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyConfigured {
        #[key]
        pub policy_id: felt252,
        #[key]
        pub audience: ContractAddress,
        pub program_measurement: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PolicyStatusChanged {
        #[key]
        pub policy_id: felt252,
        pub active: bool,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ResultConsumed {
        #[key]
        pub policy_id: felt252,
        #[key]
        pub job_id: felt252,
        #[key]
        pub scope_nullifier: felt252,
        pub result_commitment: felt252,
        pub outcome: u8,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        assert(admin.is_non_zero(), errors::ZERO_ADMIN);
        self.admin.write(admin);
    }

    #[abi(embed_v0)]
    impl ComputeVerifierImpl of IGigstarkComputeVerifier<ContractState> {
        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn get_policy(self: @ContractState, policy_id: felt252) -> GigstarkComputePolicy {
            self.policies.read(policy_id)
        }

        fn is_nullifier_used(
            self: @ContractState, policy_id: felt252, scope_nullifier: felt252,
        ) -> bool {
            self.used_nullifiers.read(nullifier_key(policy_id, scope_nullifier))
        }

        fn get_result_digest(self: @ContractState, receipt: GigstarkComputeReceipt) -> felt252 {
            let policy = self.policies.read(receipt.policy_id);
            assert(policy.tee_attestor_public_key != 0, errors::INVALID_POLICY);
            result_digest(get_contract_address(), get_tx_info().unbox().chain_id, policy, receipt)
        }

        fn consume_result(
            ref self: ContractState,
            expected_job_id: felt252,
            expected_input_commitment: felt252,
            receipt: GigstarkComputeReceipt,
        ) -> u8 {
            let policy = self.policies.read(receipt.policy_id);
            assert(policy.tee_attestor_public_key != 0, errors::INVALID_POLICY);
            assert(policy.active, errors::POLICY_INACTIVE);
            assert(
                policy.tee_attestor_public_key != policy.zk_verifier_public_key,
                errors::SAME_AUTHORITY,
            );

            let now = get_block_timestamp();
            assert(now >= policy.valid_from && now < policy.valid_until, errors::POLICY_EXPIRED);
            assert(get_caller_address() == policy.audience, errors::AUDIENCE_MISMATCH);
            assert(receipt.audience == policy.audience, errors::AUDIENCE_MISMATCH);
            assert(receipt.job_id == expected_job_id, errors::JOB_MISMATCH);
            assert(receipt.input_commitment == expected_input_commitment, errors::INPUT_MISMATCH);
            assert(
                receipt.policy_id != 0
                    && receipt.job_id != 0
                    && receipt.input_commitment != 0
                    && receipt.evidence_commitment != 0
                    && receipt.result_commitment != 0
                    && receipt.attestation_commitment != 0
                    && receipt.proof_commitment != 0
                    && receipt.scope_nullifier != 0
                    && (receipt.outcome == COMPUTE_OUTCOME_BUYER
                        || receipt.outcome == COMPUTE_OUTCOME_SELLER),
                errors::INVALID_RECEIPT,
            );
            assert(
                receipt.issued_at >= policy.valid_from
                    && receipt.issued_at <= now
                    && receipt.expires_at > now
                    && receipt.expires_at <= policy.valid_until,
                errors::RECEIPT_EXPIRED,
            );

            let key = nullifier_key(receipt.policy_id, receipt.scope_nullifier);
            assert(!self.used_nullifiers.read(key), errors::NULLIFIER_USED);

            let digest = result_digest(
                get_contract_address(), get_tx_info().unbox().chain_id, policy, receipt,
            );
            assert_signature(
                digest,
                policy.tee_attestor_public_key,
                receipt.tee_signature_r,
                receipt.tee_signature_s,
                errors::INVALID_TEE_SIGNATURE,
            );
            assert_signature(
                digest,
                policy.zk_verifier_public_key,
                receipt.zk_signature_r,
                receipt.zk_signature_s,
                errors::INVALID_ZK_SIGNATURE,
            );

            self.used_nullifiers.write(key, true);
            self
                .emit(
                    ResultConsumed {
                        policy_id: receipt.policy_id,
                        job_id: receipt.job_id,
                        scope_nullifier: receipt.scope_nullifier,
                        result_commitment: receipt.result_commitment,
                        outcome: receipt.outcome,
                    },
                );
            receipt.outcome
        }

        fn set_policy(
            ref self: ContractState,
            policy_id: felt252,
            audience: ContractAddress,
            program_measurement: felt252,
            compute_policy_hash: felt252,
            valid_from: u64,
            valid_until: u64,
            tee_attestor_public_key: felt252,
            zk_verifier_public_key: felt252,
        ) {
            self.assert_admin();
            assert(
                policy_id != 0
                    && audience.is_non_zero()
                    && program_measurement != 0
                    && compute_policy_hash != 0
                    && valid_until > valid_from
                    && tee_attestor_public_key != 0
                    && zk_verifier_public_key != 0,
                errors::INVALID_POLICY,
            );
            assert(tee_attestor_public_key != zk_verifier_public_key, errors::SAME_AUTHORITY);
            self
                .policies
                .write(
                    policy_id,
                    GigstarkComputePolicy {
                        audience,
                        program_measurement,
                        compute_policy_hash,
                        valid_from,
                        valid_until,
                        tee_attestor_public_key,
                        zk_verifier_public_key,
                        active: true,
                    },
                );
            self.emit(PolicyConfigured { policy_id, audience, program_measurement });
        }

        fn set_policy_active(ref self: ContractState, policy_id: felt252, active: bool) {
            self.assert_admin();
            let mut policy = self.policies.read(policy_id);
            assert(policy.tee_attestor_public_key != 0, errors::INVALID_POLICY);
            policy.active = active;
            self.policies.write(policy_id, policy);
            self.emit(PolicyStatusChanged { policy_id, active });
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_admin(self: @ContractState) {
            assert(get_caller_address() == self.admin.read(), errors::ONLY_ADMIN);
        }
    }

    fn nullifier_key(policy_id: felt252, scope_nullifier: felt252) -> felt252 {
        poseidon_hash_span([COMPUTE_NULLIFIER_DOMAIN, policy_id, scope_nullifier].span())
    }

    fn assert_signature(
        digest: felt252,
        public_key: felt252,
        signature_r: felt252,
        signature_s: felt252,
        error: felt252,
    ) {
        let signature_r_u256: u256 = signature_r.into();
        let signature_s_u256: u256 = signature_s.into();
        let curve_order: u256 = STARK_CURVE_ORDER.into();
        let half_order: u256 = STARK_CURVE_HALF_ORDER.into();
        assert(
            signature_r_u256 < curve_order
                && signature_s_u256 <= half_order
                && check_ecdsa_signature(digest, public_key, signature_r, signature_s),
            error,
        );
    }

    fn result_digest(
        verifier: ContractAddress,
        chain_id: felt252,
        policy: GigstarkComputePolicy,
        receipt: GigstarkComputeReceipt,
    ) -> felt252 {
        poseidon_hash_span(
            [
                COMPUTE_RECEIPT_DOMAIN, chain_id, verifier.into(), receipt.policy_id,
                policy.audience.into(), policy.program_measurement, policy.compute_policy_hash,
                policy.valid_from.into(), policy.valid_until.into(), receipt.job_id,
                receipt.input_commitment, receipt.evidence_commitment, receipt.result_commitment,
                receipt.outcome.into(), receipt.attestation_commitment, receipt.proof_commitment,
                receipt.scope_nullifier, receipt.issued_at.into(), receipt.expires_at.into(),
            ]
                .span(),
        )
    }
}
