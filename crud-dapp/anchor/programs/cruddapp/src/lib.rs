#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("EqQTzqoz1Zv5EsPjb2mATp9mkiY5Ck1h7Lqj9Nyx5gCi");

#[program]
pub mod cruddapp {
    use super::*;

    pub fn create_journal(ctx: Context<CreateJournal>, title: String, content: String)->Result<()>{
      *ctx.accounts.journal = Journal {
        content,
        title,
        writer: ctx.accounts.writer.key(),
      };
      Ok(())
    }

    pub fn update_journal(ctx: Context<UpdateJournal>, _title: String, content: String)->Result<()>{
      let journal = &mut ctx.accounts.journal;
      journal.content = content;

      Ok(())
    }

    pub fn delete_journal(_ctx: Context<DeleteJournal>, _title: String)->Result<()>{
      Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateJournal<'info> {
  #[account(
    mut
  )]
  pub writer: Signer<'info>,
  #[account(
    init,
    payer = writer,
    space = 8 + Journal::INIT_SPACE,
    seeds = [title.as_bytes(), writer.key().as_ref()],
    bump
  )]
  pub journal: Account<'info, Journal>,

  pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(title: String, content: String)]
pub struct UpdateJournal<'info> {
  #[account(mut)]
  pub writer: Signer<'info>,

  #[account(
    mut,
    realloc = 8 + Journal::INIT_SPACE-200 + (4 + content.len()),
    realloc::payer = writer,
    realloc::zero = true,
    seeds= [title.as_bytes(), writer.key().as_ref()],
    bump,
  )]
  pub journal: Account<'info, Journal>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteJournal<'info> {
  #[account(mut)]
  pub writer: Signer<'info>,

  #[account(
    mut,
    seeds = [title.as_bytes(), writer.key().as_ref()],
    bump,
    close = writer,
  )]
  pub journal: Account<'info, Journal>,

  pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct Journal {
  #[max_len(30)]
  pub title: String,
  #[max_len(200)]
  pub content: String,
  pub writer: Pubkey,
}
