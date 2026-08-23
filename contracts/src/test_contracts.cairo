use super::IActionAuthorizationVerifier;

fn authorization_key(
    role_commitment: felt252, action_statement: felt252, authorization_digest: felt252,
) -> felt252 {
    core::poseidon::poseidon_hash_span(
        [role_commitment, action_statement, authorization_digest].span(),
    )
}

#[starknet::interface]
pub trait IMockAuthorizationControl<TContractState> {
    fn set_authorized(
        ref self: TContractState,
        role_commitment: felt252,
        action_statement: felt252,
        authorization_digest: felt252,
        allowed: bool,
    );
}

#[starknet::contract]
pub mod MockAuthorizationVerifier {
    use starknet::storage::{StorageMapReadAccess, StorageMapWriteAccess};
    use super::super::GigstarkPassportProof;
    use super::{IActionAuthorizationVerifier, IMockAuthorizationControl, authorization_key};

    #[storage]
    struct Storage {
        authorizations: starknet::storage::Map<felt252, bool>,
    }

    #[abi(embed_v0)]
    impl AuthorizationImpl of IActionAuthorizationVerifier<ContractState> {
        fn consume_authorization(
            ref self: ContractState,
            role_commitment: felt252,
            action_statement: felt252,
            proof: GigstarkPassportProof,
        ) -> bool {
            self
                .authorizations
                .read(authorization_key(role_commitment, action_statement, proof.proof_commitment))
        }
    }

    #[abi(embed_v0)]
    impl ControlImpl of IMockAuthorizationControl<ContractState> {
        fn set_authorized(
            ref self: ContractState,
            role_commitment: felt252,
            action_statement: felt252,
            authorization_digest: felt252,
            allowed: bool,
        ) {
            self
                .authorizations
                .write(
                    authorization_key(role_commitment, action_statement, authorization_digest),
                    allowed,
                );
        }
    }
}
