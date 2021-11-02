use anchor_lang::prelude::*;

#[error]
pub enum ErrorCode {
    #[msg("Not enough space left in whitelist!")]
    NotEnoughSpace,
}
