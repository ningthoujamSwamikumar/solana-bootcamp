#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        description: String,
        start_time: u64,
        end_time: u64,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.id = poll_id;
        poll.description = description;
        poll.start_time = start_time;
        poll.end_time = end_time;

        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        _poll_id: u64,
        candidate_name: String,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.name = candidate_name;
        candidate.vote = 0;

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _poll_id: u64, _candidate_name: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let candidate = &mut ctx.accounts.candidate;
        let current_time = Clock::get()?.unix_timestamp;

        if current_time > poll.end_time as i64 {
            return Err(ErrorCode::VotingCompleted.into());
        }
        if current_time < poll.start_time as i64 {
            return Err(ErrorCode::VotingNotStarted.into());
        }

        candidate.vote += 1;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR_SIZE + Poll::INIT_SPACE,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR_SIZE + Candidate::INIT_SPACE,
        seeds = [b"candidate", poll.key().as_ref(), candidate_name.as_bytes().as_ref()],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct Vote<'info> {
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,

    #[account(
        mut,
        seeds = [b"candidate", poll.key().as_ref(), candidate_name.as_bytes().as_ref()],
        bump,
    )]
    pub candidate: Account<'info, Candidate>,
}


#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub id: u64,
    #[max_len(50)]
    pub description: String,
    pub start_time: u64,
    pub end_time: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(32)]
    pub name: String,
    pub vote: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has ended")]
    VotingCompleted,
}
