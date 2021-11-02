use anchor_lang::prelude::*;
use std::convert::TryInto;
use std::ops::DerefMut;

pub mod errors;
use errors::ErrorCode;

declare_id!("G9B3QBo3BJAbn37XmaBNN4ybjLXuiUSRxwgjGdyau85J");

const MAX_LEN: usize = 58;

#[program]
pub mod whitelist {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        let whitelist_state = &mut ctx.accounts.whitelist_state;
        let mut whitelist_data = ctx.accounts.whitelist_data.load_init()?;
        let data = whitelist_data.deref_mut();
        data.data = [Pubkey::default(); MAX_LEN];
        whitelist_state.authority = authority;
        whitelist_state.counter = 0;
        Ok(())
    }

    pub fn add_whitelist_addresses(
        ctx: Context<AddWhitelistAddresses>,
        addresses: Vec<Pubkey>,
    ) -> ProgramResult {
        let whitelist_state = &mut ctx.accounts.whitelist_state;
        let mut whitelist_data = ctx.accounts.whitelist_data.load_mut()?;
        let mut data = whitelist_data.deref_mut();

        let length = addresses.len();
        let mut counter = whitelist_state.counter as usize;

        // Check that new addresses don't exceed remaining space
        if length + counter > MAX_LEN {
            return Err(ErrorCode::NotEnoughSpace.into());
        }
        msg!("counter: {}", counter);
        let mut current_data: Vec<Pubkey> = Vec::new();
        // Fill with current data
        current_data.extend_from_slice(&data.data[0..counter]);
        counter += length;

        // Add new addresses
        current_data.extend_from_slice(&addresses);

        // Fill remaining data with default Pubkey
        for _ in counter..MAX_LEN {
            current_data.push(Pubkey::default());
        }
        msg!("current data: {:?}", current_data.len());

        // Update data
        let new_data: [Pubkey; MAX_LEN] = match current_data.try_into() {
            Ok(data) => data,
            Err(e) => {
                msg!("Error: {:?}", e);
                return Err(ProgramError::InvalidArgument);
            }
        };
        data.data = new_data;
        whitelist_state.counter = counter as u64;
        msg!("counter: {}", counter);

        Ok(())
    }

    pub fn reset_whitelist_counter(ctx: Context<ResetWhitelistCounter>) -> ProgramResult {
        let whitelist_state = &mut ctx.accounts.whitelist_state;
        whitelist_state.counter = 0;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8)]
    pub whitelist_state: Account<'info, WhitelistState>,
    #[account(zero)]
    pub whitelist_data: AccountLoader<'info, WhitelistData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddWhitelistAddresses<'info> {
    #[account(mut, has_one = authority)]
    pub whitelist_state: Account<'info, WhitelistState>,
    #[account(mut)]
    pub whitelist_data: AccountLoader<'info, WhitelistData>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResetWhitelistCounter<'info> {
    #[account(zero, has_one = authority)]
    pub whitelist_state: Account<'info, WhitelistState>,
    pub authority: Signer<'info>,
}

#[account]
pub struct WhitelistState {
    pub authority: Pubkey,
    pub counter: u64,
}

#[account(zero_copy)]
pub struct WhitelistData {
    pub data: [Pubkey; 58],
}
