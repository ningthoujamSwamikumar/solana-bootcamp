pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6mL1SpNtMg1T1bRUNdbPJkTMjkUo5VeYX8NTn6kBGqjw");

#[program]
pub mod swap {
    use super::*;

    pub fn make_offer(
        context: Context<MakeOffer>,
        id: u64,
        token_a_offered_amount: u64,
        token_b_wanted_amount: u64,
    ) -> Result<()> {
        instructions::make_offer::send_token_to_vault(&context, token_a_offered_amount)?;

        instructions::make_offer::save_offer(context, id, token_b_wanted_amount)
    }

    pub fn take_offer(context: Context<TakeOffer>) -> Result<()> {
        //send token b to maker's account
        instructions::send_wanted_tokens_to_maker(&context)?;
        //send token a from vault to taker's account
        instructions::withdraw_and_close_vault(context)
    }
}
