use core::num::traits::Zero;
use openzeppelin::interfaces::token::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use privacy::objects::OpenNoteDeposit;
use snforge_std::signature::stark_curve::{
    StarkCurveKeyPair, StarkCurveKeyPairImpl, StarkCurveSignerImpl,
};
use snforge_std::{
    ContractClassTrait, CustomToken, DeclareResultTrait, Token, TokenTrait, declare,
    start_cheat_block_timestamp, stop_cheat_block_timestamp,
};
use starknet::{ContractAddress, SyscallResultTrait};
use starkware_utils_testing::test_utils::{
    Deployable, TokenConfig, TokenHelperTrait, assert_panic_with_felt_error,
    cheat_caller_address_once,
};
use super::super::compute_verifier::{
    COMPUTE_OUTCOME_BUYER, COMPUTE_OUTCOME_SELLER, GigstarkComputeReceipt,
    IGigstarkComputeVerifierDispatcher, IGigstarkComputeVerifierDispatcherTrait,
};
use super::super::gigstark_passport::PASSPORT_PURPOSE_ESCROW_ROLE;
use super::super::test_contracts::{
    IMockAuthorizationControlDispatcher, IMockAuthorizationControlDispatcherTrait,
};
use super::super::{
    GigstarkPassportProof, IGigstarkEscrowDispatcher, IGigstarkEscrowDispatcherTrait,
    IGigstarkEscrowSafeDispatcher, IGigstarkEscrowSafeDispatcherTrait, OP_CLAIM,
    OP_CONFIRM_DELIVERY, OP_DEPOSIT, OP_OPEN_DISPUTE, OP_SUBMIT_DELIVERY, OP_TIMEOUT, ROLE_BUYER,
    ROLE_NONE, ROLE_SELLER, STATUS_BUYER_WINS, STATUS_DISPUTED, STATUS_SELLER_WINS,
    empty_gigstark_passport_proof, errors,
};

const PRIVACY_POOL: felt252 = 'PRIVACY_POOL';
const COMPUTE_ADMIN: felt252 = 'COMPUTE_ADMIN';
const COMPUTE_POLICY: felt252 = 'DISPUTE_COMPUTE';
const PROGRAM_MEASUREMENT: felt252 = 'ENCLAVE_IMAGE_V1';
const COMPUTE_POLICY_HASH: felt252 = 'DISPUTE_POLICY_V1';
const BUYER_COMMITMENT: felt252 = 'BUYER_ROLE';
const SELLER_COMMITMENT: felt252 = 'SELLER_ROLE';
const ESCROW_ID: felt252 = 'ESCROW_ONE';
const AMOUNT: u128 = 100;
const DEADLINE: u64 = 1_000;
const STARK_CURVE_ORDER: felt252 =
    0x800000000000010ffffffffffffffffb781126dcae7b2321e66a241adc64d2f;
const STARK_CURVE_HALF_ORDER: felt252 =
    0x4000000000000087fffffffffffffffdbc08936e573d9190f335120d6e32697;

fn mock_proof(authorization_digest: felt252) -> GigstarkPassportProof {
    let mut proof = empty_gigstark_passport_proof();
    proof.policy_id = 'MOCK_POLICY';
    proof.purpose = PASSPORT_PURPOSE_ESCROW_ROLE;
    proof.proof_commitment = authorization_digest;
    proof
}

#[derive(Copy, Drop)]
struct TestContext {
    escrow_address: ContractAddress,
    verifier_address: ContractAddress,
    compute_verifier_address: ContractAddress,
    token: Token,
    tee_attestor: StarkCurveKeyPair,
    zk_verifier: StarkCurveKeyPair,
}

#[generate_trait]
impl TestContextImpl of TestContextTrait {
    fn escrow(self: @TestContext) -> IGigstarkEscrowDispatcher {
        IGigstarkEscrowDispatcher { contract_address: *self.escrow_address }
    }

    #[feature("safe_dispatcher")]
    fn safe_escrow(self: @TestContext) -> IGigstarkEscrowSafeDispatcher {
        IGigstarkEscrowSafeDispatcher { contract_address: *self.escrow_address }
    }

    fn authorize(
        self: @TestContext,
        escrow_id: felt252,
        operation: u8,
        payload: felt252,
        role_commitment: felt252,
        authorization_digest: felt252,
    ) {
        let statement = self.escrow().get_action_statement(escrow_id, operation, payload);
        IMockAuthorizationControlDispatcher { contract_address: *self.verifier_address }
            .set_authorized(role_commitment, statement, authorization_digest, true);
    }

    fn compute_verifier(self: @TestContext) -> IGigstarkComputeVerifierDispatcher {
        IGigstarkComputeVerifierDispatcher { contract_address: *self.compute_verifier_address }
    }

    fn signed_compute_receipt(
        self: @TestContext, outcome: u8, scope_nullifier: felt252,
    ) -> GigstarkComputeReceipt {
        let input_commitment = self.escrow().get_dispute_input_commitment(ESCROW_ID);
        let mut receipt = GigstarkComputeReceipt {
            policy_id: COMPUTE_POLICY,
            audience: *self.escrow_address,
            job_id: ESCROW_ID,
            input_commitment,
            evidence_commitment: 'PRIVATE_EVIDENCE_HASH',
            result_commitment: 'COMPUTE_RESULT_HASH',
            outcome,
            attestation_commitment: 'TEE_ATTESTATION_HASH',
            proof_commitment: 'ZK_PROOF_HASH',
            scope_nullifier,
            issued_at: 0,
            expires_at: 100,
            tee_signature_r: 0,
            tee_signature_s: 0,
            zk_signature_r: 0,
            zk_signature_s: 0,
        };
        let digest = self.compute_verifier().get_result_digest(receipt);
        let (tee_r, tee_s) = self.tee_attestor.sign(digest).unwrap();
        let (zk_r, zk_s) = self.zk_verifier.sign(digest).unwrap();
        receipt.tee_signature_r = tee_r;
        receipt.tee_signature_s = canonical_s(tee_s);
        receipt.zk_signature_r = zk_r;
        receipt.zk_signature_s = canonical_s(zk_s);
        receipt
    }

    fn invoke(
        self: @TestContext,
        operation: u8,
        escrow_id: felt252,
        actor_role: u8,
        token: ContractAddress,
        amount: u128,
        buyer_commitment: felt252,
        seller_commitment: felt252,
        delivery_commitment: felt252,
        deadline: u64,
        note_id: felt252,
        proof: GigstarkPassportProof,
    ) -> Span<OpenNoteDeposit> {
        cheat_caller_address_once(
            contract_address: *self.escrow_address, caller_address: privacy_pool(),
        );
        self
            .escrow()
            .privacy_invoke(
                operation,
                escrow_id,
                actor_role,
                token,
                amount,
                buyer_commitment,
                seller_commitment,
                delivery_commitment,
                deadline,
                note_id,
                proof,
            )
    }

    fn deposit(self: @TestContext) {
        self.token.supply(address: *self.escrow_address, amount: AMOUNT);
        let deposits = self
            .invoke(
                OP_DEPOSIT,
                ESCROW_ID,
                ROLE_NONE,
                self.token.contract_address(),
                AMOUNT,
                BUYER_COMMITMENT,
                SELLER_COMMITMENT,
                0,
                DEADLINE,
                0,
                empty_gigstark_passport_proof(),
            );
        assert(deposits.is_empty(), 'DEPOSIT_NOT_EMPTY');
    }

    fn submit_delivery(self: @TestContext, authorization_digest: felt252) {
        self
            .authorize(
                ESCROW_ID,
                OP_SUBMIT_DELIVERY,
                'DELIVERY_HASH',
                SELLER_COMMITMENT,
                authorization_digest,
            );
        self
            .invoke(
                OP_SUBMIT_DELIVERY,
                ESCROW_ID,
                ROLE_SELLER,
                Zero::zero(),
                0,
                0,
                0,
                'DELIVERY_HASH',
                0,
                0,
                mock_proof(authorization_digest),
            );
    }
}

fn setup() -> TestContext {
    let verifier_class = declare(contract: "MockAuthorizationVerifier")
        .unwrap_syscall()
        .contract_class();
    let (verifier_address, _) = verifier_class.deploy(@array![]).unwrap_syscall();

    let tee_attestor = StarkCurveKeyPairImpl::from_secret_key('ESCROW_TEE_SECRET');
    let zk_verifier = StarkCurveKeyPairImpl::from_secret_key('ESCROW_ZK_SECRET');
    let compute_class = declare(contract: "GigstarkComputeVerifier")
        .unwrap_syscall()
        .contract_class();
    let (compute_verifier_address, _) = compute_class
        .deploy(@array![COMPUTE_ADMIN])
        .unwrap_syscall();

    let escrow_class = declare(contract: "GigstarkEscrow").unwrap_syscall().contract_class();
    let constructor_calldata = array![
        PRIVACY_POOL, compute_verifier_address.into(), verifier_address.into(),
    ];
    let (escrow_address, _) = escrow_class.deploy(@constructor_calldata).unwrap_syscall();

    cheat_caller_address_once(
        contract_address: compute_verifier_address,
        caller_address: COMPUTE_ADMIN.try_into().unwrap(),
    );
    IGigstarkComputeVerifierDispatcher { contract_address: compute_verifier_address }
        .set_policy(
            COMPUTE_POLICY,
            escrow_address,
            PROGRAM_MEASUREMENT,
            COMPUTE_POLICY_HASH,
            0,
            2_000,
            tee_attestor.public_key,
            zk_verifier.public_key,
        );

    let token_config = TokenConfig {
        name: "Gigstark Test Token",
        symbol: "GTT",
        decimals: 18,
        initial_supply: 0,
        owner: 'TOKEN_OWNER'.try_into().unwrap(),
    };
    let deployed_token = token_config.deploy();
    let token = Token::Custom(
        CustomToken {
            contract_address: deployed_token.address,
            balances_variable_selector: selector!("ERC20_balances"),
        },
    );
    TestContext {
        escrow_address,
        verifier_address,
        compute_verifier_address,
        token,
        tee_attestor,
        zk_verifier,
    }
}

fn privacy_pool() -> ContractAddress {
    PRIVACY_POOL.try_into().unwrap()
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
fn test_pool_only_deposit_and_collateral_accounting() {
    let context = setup();
    context.deposit();
    let escrow = context.escrow().get_escrow(ESCROW_ID);
    assert_eq!(escrow.amount, AMOUNT);
    assert_eq!(
        context.escrow().get_accounted_balance(context.token.contract_address()), AMOUNT.into(),
    );
}

#[test]
fn test_unaccounted_surplus_does_not_inflate_or_block_deposit() {
    let context = setup();
    context.token.supply(address: context.escrow_address, amount: AMOUNT + 1);
    context
        .invoke(
            OP_DEPOSIT,
            ESCROW_ID,
            ROLE_NONE,
            context.token.contract_address(),
            AMOUNT,
            BUYER_COMMITMENT,
            SELLER_COMMITMENT,
            0,
            DEADLINE,
            0,
            empty_gigstark_passport_proof(),
        );
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).amount, AMOUNT);
    assert_eq!(
        context.escrow().get_accounted_balance(context.token.contract_address()), AMOUNT.into(),
    );
}

#[test]
#[feature("safe_dispatcher")]
fn test_wrong_pool_caller_fails() {
    let context = setup();
    context.token.supply(address: context.escrow_address, amount: AMOUNT);
    let result = context
        .safe_escrow()
        .privacy_invoke(
            OP_DEPOSIT,
            ESCROW_ID,
            ROLE_NONE,
            context.token.contract_address(),
            AMOUNT,
            BUYER_COMMITMENT,
            SELLER_COMMITMENT,
            0,
            DEADLINE,
            0,
            empty_gigstark_passport_proof(),
        );
    assert_panic_with_felt_error(:result, expected_error: errors::ONLY_PRIVACY_POOL);
}

#[test]
#[feature("safe_dispatcher")]
fn test_deposit_rejects_insufficient_balance() {
    let context = setup();
    context.token.supply(address: context.escrow_address, amount: AMOUNT);
    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let result = context
        .safe_escrow()
        .privacy_invoke(
            OP_DEPOSIT,
            ESCROW_ID,
            ROLE_NONE,
            context.token.contract_address(),
            AMOUNT + 1,
            BUYER_COMMITMENT,
            SELLER_COMMITMENT,
            0,
            DEADLINE,
            0,
            empty_gigstark_passport_proof(),
        );
    assert_panic_with_felt_error(:result, expected_error: errors::INSUFFICIENT_ESCROW_BALANCE);
}

#[test]
#[feature("safe_dispatcher")]
fn test_unapproved_role_authorization_fails() {
    let context = setup();
    context.deposit();
    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let result = context
        .safe_escrow()
        .privacy_invoke(
            OP_SUBMIT_DELIVERY,
            ESCROW_ID,
            ROLE_SELLER,
            Zero::zero(),
            0,
            0,
            0,
            'DELIVERY_HASH',
            0,
            0,
            mock_proof('UNAPPROVED_AUTH'),
        );
    assert_panic_with_felt_error(:result, expected_error: errors::ACTION_NOT_AUTHORIZED);
}

#[test]
fn test_seller_win_returns_one_note_and_approves_pool() {
    let context = setup();
    context.deposit();
    context.submit_delivery('AUTH_DELIVERY');
    context.authorize(ESCROW_ID, OP_CONFIRM_DELIVERY, 0, BUYER_COMMITMENT, 'AUTH_CONFIRM');
    context
        .invoke(
            OP_CONFIRM_DELIVERY,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            mock_proof('AUTH_CONFIRM'),
        );
    context.authorize(ESCROW_ID, OP_CLAIM, 'SELLER_NOTE', SELLER_COMMITMENT, 'AUTH_CLAIM');
    let deposits = context
        .invoke(
            OP_CLAIM,
            ESCROW_ID,
            ROLE_SELLER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            'SELLER_NOTE',
            mock_proof('AUTH_CLAIM'),
        );
    assert_eq!(deposits.len(), 1);
    assert_eq!(
        *deposits[0],
        OpenNoteDeposit {
            note_id: 'SELLER_NOTE', token: context.token.contract_address(), amount: AMOUNT,
        },
    );
    assert_eq!(
        IERC20Dispatcher { contract_address: context.token.contract_address() }
            .allowance(owner: context.escrow_address, spender: privacy_pool()),
        AMOUNT.into(),
    );
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).status, STATUS_SELLER_WINS);
}

#[test]
#[feature("safe_dispatcher")]
fn test_replay_and_double_claim_fail() {
    let context = setup();
    context.deposit();
    context.submit_delivery('AUTH_DELIVERY');

    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let replay = context
        .safe_escrow()
        .privacy_invoke(
            OP_SUBMIT_DELIVERY,
            ESCROW_ID,
            ROLE_SELLER,
            Zero::zero(),
            0,
            0,
            0,
            'DELIVERY_HASH',
            0,
            0,
            mock_proof('AUTH_DELIVERY'),
        );
    assert_panic_with_felt_error(result: replay, expected_error: errors::INVALID_STATE);

    context.authorize(ESCROW_ID, OP_CONFIRM_DELIVERY, 0, BUYER_COMMITMENT, 'AUTH_CONFIRM');
    context
        .invoke(
            OP_CONFIRM_DELIVERY,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            mock_proof('AUTH_CONFIRM'),
        );
    context.authorize(ESCROW_ID, OP_CLAIM, 'NOTE_ONE', SELLER_COMMITMENT, 'AUTH_ONE');
    context
        .invoke(
            OP_CLAIM,
            ESCROW_ID,
            ROLE_SELLER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            'NOTE_ONE',
            mock_proof('AUTH_ONE'),
        );

    context.authorize(ESCROW_ID, OP_CLAIM, 'NOTE_TWO', SELLER_COMMITMENT, 'AUTH_TWO');
    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let duplicate = context
        .safe_escrow()
        .privacy_invoke(
            OP_CLAIM,
            ESCROW_ID,
            ROLE_SELLER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            'NOTE_TWO',
            mock_proof('AUTH_TWO'),
        );
    assert_panic_with_felt_error(result: duplicate, expected_error: errors::DOUBLE_CLAIM);
}

#[test]
#[feature("safe_dispatcher")]
fn test_hybrid_compute_receipt_resolves_dispute_to_buyer() {
    let context = setup();
    context.deposit();
    context.authorize(ESCROW_ID, OP_OPEN_DISPUTE, 0, BUYER_COMMITMENT, 'AUTH_DISPUTE');
    context
        .invoke(
            OP_OPEN_DISPUTE,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            mock_proof('AUTH_DISPUTE'),
        );
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).status, STATUS_DISPUTED);

    let receipt = context.signed_compute_receipt(COMPUTE_OUTCOME_BUYER, 'ESCROW_COMPUTE_ONCE');
    context.escrow().resolve_dispute(ESCROW_ID, receipt);
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).status, STATUS_BUYER_WINS);
}

#[test]
fn test_hybrid_compute_receipt_resolves_dispute_to_seller() {
    let context = setup();
    context.deposit();
    context.authorize(ESCROW_ID, OP_OPEN_DISPUTE, 0, BUYER_COMMITMENT, 'AUTH_DISPUTE_SELLER');
    context
        .invoke(
            OP_OPEN_DISPUTE,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            mock_proof('AUTH_DISPUTE_SELLER'),
        );
    let receipt = context.signed_compute_receipt(COMPUTE_OUTCOME_SELLER, 'ESCROW_COMPUTE_SELLER');
    context.escrow().resolve_dispute(ESCROW_ID, receipt);
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).status, STATUS_SELLER_WINS);
}

#[test]
#[feature("safe_dispatcher")]
fn test_timeout_requires_expiry() {
    let context = setup();
    context.deposit();
    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let early = context
        .safe_escrow()
        .privacy_invoke(
            OP_TIMEOUT,
            ESCROW_ID,
            ROLE_NONE,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            empty_gigstark_passport_proof(),
        );
    assert_panic_with_felt_error(result: early, expected_error: errors::NOT_EXPIRED);
}

#[test]
#[feature("safe_dispatcher")]
fn test_timeout_refund_returns_one_buyer_note_and_rejects_double_claim() {
    let context = setup();
    context.deposit();

    start_cheat_block_timestamp(context.escrow_address, DEADLINE);
    context
        .invoke(
            OP_TIMEOUT,
            ESCROW_ID,
            ROLE_NONE,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            0,
            empty_gigstark_passport_proof(),
        );
    stop_cheat_block_timestamp(context.escrow_address);
    assert_eq!(context.escrow().get_escrow(ESCROW_ID).status, STATUS_BUYER_WINS);

    context.authorize(ESCROW_ID, OP_CLAIM, 'BUYER_NOTE', BUYER_COMMITMENT, 'AUTH_BUYER');
    let deposits = context
        .invoke(
            OP_CLAIM,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            'BUYER_NOTE',
            mock_proof('AUTH_BUYER'),
        );
    assert_eq!(deposits.len(), 1);
    assert_eq!(
        *deposits[0],
        OpenNoteDeposit {
            note_id: 'BUYER_NOTE', token: context.token.contract_address(), amount: AMOUNT,
        },
    );

    context.authorize(ESCROW_ID, OP_CLAIM, 'BUYER_NOTE_2', BUYER_COMMITMENT, 'AUTH_BUYER_2');
    cheat_caller_address_once(
        contract_address: context.escrow_address, caller_address: privacy_pool(),
    );
    let result = context
        .safe_escrow()
        .privacy_invoke(
            OP_CLAIM,
            ESCROW_ID,
            ROLE_BUYER,
            Zero::zero(),
            0,
            0,
            0,
            0,
            0,
            'BUYER_NOTE_2',
            mock_proof('AUTH_BUYER_2'),
        );
    assert_panic_with_felt_error(:result, expected_error: errors::DOUBLE_CLAIM);
}
