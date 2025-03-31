use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Offer {
    pub id: u64,
    pub maker: Pubkey,
    pub token_mint_a: Pubkey,   //offering in this token
    pub token_mint_b: Pubkey,   //this is the desired token for the offer
    pub token_b_wanted_amount: u64,
    pub bump: u8,
}