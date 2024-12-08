use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("4qKuYQJ9hMGH8gqj1UWLPAYxNHxVvabz4kwSuE52in7f");

#[program]
pub mod pump {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        fee_wallet: Pubkey,
        initial_supply: u64,
        timestamp: i64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
        msg!("Initializing state account...");
        

        state.authority = ctx.accounts.authority.key();
        state.fee_wallet = fee_wallet;
        state.total_supply = initial_supply;
        state.circulating_supply = 0;
        state.market_cap = 42_000;
        state.graduated = false;
        state.lp_locked = false;
        state.timestamp = timestamp;
        state.last_update = timestamp;

        // Set new parameters
        state.lp_supply = initial_supply.checked_mul(20).unwrap().checked_div(100).unwrap();
        state.initial_price = calculate_initial_price(state.market_cap, initial_supply)?;
        state.current_price = state.initial_price;
        state.graduation_threshold = 100_000_000_000;
        state.fee_percentage = 100;

        msg!("State account initialized successfully");
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<Trade>, amount: u64) -> Result<()> {
        // Check graduation status first
        require!(
            !ctx.accounts.state.graduated || !ctx.accounts.state.lp_locked, 
            PumpError::MarketGraduated
        );


        let price = calculate_price(ctx.accounts.state.circulating_supply, amount)?;
        let fee = calculate_fee(price, ctx.accounts.state.fee_percentage)?;
        let total_cost = price.checked_add(fee).ok_or(PumpError::Overflow)?;


        if !ctx.accounts.state.graduated {
            check_price_limit(
                ctx.accounts.state.current_price, 
                ctx.accounts.state.initial_price
            )?;
        }

 
        let fee_wallet = ctx.accounts.state.fee_wallet;


        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.state.key(),
            total_cost,
        );
        invoke(
            &transfer_ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.state.to_account_info(),
            ],
        )?;


        if fee > 0 {
            let fee_ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.state.key(),
                &fee_wallet,
                fee,
            );
            invoke_signed(
                &fee_ix,
                &[
                    ctx.accounts.state.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[&[b"state_v2".as_ref(), &[*ctx.bumps.get("state").unwrap()]]]
            )?;
        }

        // Mint tokens to user
        let state_seeds = &[b"state_v2".as_ref(), &[*ctx.bumps.get("state").unwrap()]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                &[state_seeds]
            ),
            amount,
        )?;

 
        let state = &mut ctx.accounts.state;
        state.circulating_supply = state.circulating_supply.checked_add(amount)
            .ok_or(PumpError::Overflow)?;
        state.market_cap = calculate_market_cap(state.circulating_supply)?;
        state.current_price = calculate_price(state.circulating_supply, 1)?;

        // Check graduation eligibility after purchase
        if !state.graduated && check_graduation(state.market_cap, state.graduation_threshold) {
            msg!("Market cap threshold reached! Ready for graduation.");
        }

        // Emit event
        emit!(TokensPurchased {
            amount,
            price: total_cost,
            market_cap: state.market_cap,
        });

        Ok(())
    }

    pub fn sell_tokens(ctx: Context<Trade>, amount: u64) -> Result<()> {

        let return_amount = calculate_price(ctx.accounts.state.circulating_supply, amount)?;


        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

 
        let state_info = ctx.accounts.state.to_account_info();
        let user_info = ctx.accounts.user.to_account_info();

        **state_info.try_borrow_mut_lamports()? -= return_amount;
        **user_info.try_borrow_mut_lamports()? += return_amount;


        let state = &mut ctx.accounts.state;
        state.circulating_supply = state.circulating_supply.checked_sub(amount)
            .ok_or(PumpError::Overflow)?;
        state.market_cap = calculate_market_cap(state.circulating_supply)?;

        Ok(())
    }

    pub fn graduate(ctx: Context<Graduate>) -> Result<()> {

        require!(
            !ctx.accounts.state.graduated,
            PumpError::AlreadyGraduated
        );
        require!(
            ctx.accounts.state.market_cap >= ctx.accounts.state.graduation_threshold,
            PumpError::GraduationThresholdNotMet
        );
        
        // Calculate LP amount (20% of total supply)
        let lp_amount = ctx.accounts.state.total_supply
            .checked_mul(20)
            .and_then(|amt| amt.checked_div(100))
            .ok_or(PumpError::Overflow)?;
            

        let state_bump = *ctx.bumps.get("state").unwrap();
        let seeds = &[b"state_v2".as_ref(), &[state_bump]];
        let signer_seeds = &[&seeds[..]];
        
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.lp_token_account.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                signer_seeds
            ),
            lp_amount,
        )?;
        

        let state = &mut ctx.accounts.state;
        state.graduated = true;
        state.lp_locked = true;
        state.lp_supply = lp_amount;
        

        emit!(MarketGraduated {
            timestamp: Clock::get()?.unix_timestamp,
            market_cap: state.market_cap,
            lp_amount,
            final_price: state.current_price,
        });
        
        msg!("Market graduated successfully!");
        msg!("Final market cap: {}", state.market_cap);
        msg!("LP tokens minted: {}", lp_amount);
        
        Ok(())
    }

    pub fn burn_lp_tokens(ctx: Context<BurnLP>) -> Result<()> {
       
        require!(ctx.accounts.state.graduated, PumpError::NotGraduated);
        require!(ctx.accounts.state.lp_locked, PumpError::LPNotLocked);
        require!(ctx.accounts.state.lp_supply > 0, PumpError::NoLPTokens);
        
        let lp_amount = ctx.accounts.state.lp_supply;
        
        
        let state_bump = *ctx.bumps.get("state").unwrap();
        let state_seeds = &[b"state_v2".as_ref(), &[state_bump]];
        let signer_seeds = &[&state_seeds[..]];
        
      
        token::burn(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.lp_token_account.to_account_info(),
                    authority: ctx.accounts.state.to_account_info(),
                },
                signer_seeds
            ),
            lp_amount,
        )?;
        
    
        let state = &mut ctx.accounts.state;
        state.lp_supply = 0;
        
     
        emit!(LPTokensBurned {
            timestamp: Clock::get()?.unix_timestamp,
            amount: lp_amount,
        });
        
        msg!("LP tokens burned successfully: {}", lp_amount);
        Ok(())
    }

    pub fn update_fee_wallet(
        ctx: Context<UpdateFeeWallet>,
        new_fee_wallet: Pubkey
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
   
        require!(
            ctx.accounts.authority.key() == state.authority,
            PumpError::Unauthorized
        );
        

        require!(new_fee_wallet != Pubkey::default(), PumpError::InvalidFeeWallet);
        
      
        let old_wallet = state.fee_wallet;
        

        state.fee_wallet = new_fee_wallet;
        

        emit!(FeeWalletUpdated {
            old_wallet,
            new_wallet: new_fee_wallet,
        });
        
        msg!("Fee wallet updated successfully");
        msg!("Old wallet: {}", old_wallet);
        msg!("New wallet: {}", new_fee_wallet);
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(fee_wallet: Pubkey, initial_supply: u64, timestamp: i64)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = StateAccount::LEN,
        seeds = [b"state_v2"],
        bump
    )]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Trade<'info> {
    #[account(
        mut,
        seeds = [b"state_v2"],
        bump
    )]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Graduate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state_v2"],
        bump,
        constraint = state.authority == authority.key(),
        constraint = !state.graduated,
        constraint = state.market_cap >= state.graduation_threshold
    )]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = state
    )]
    pub lp_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnLP<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state_v2"],
        bump,
        constraint = state.authority == authority.key(),
        constraint = state.graduated,
        constraint = state.lp_locked
    )]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = state
    )]
    pub lp_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateFeeWallet<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"state_v2"],
        bump,
        constraint = state.authority == authority.key()
    )]
    pub state: Account<'info, StateAccount>,

    /// CHECK: This is just a public key for the new fee wallet, no account checks needed
    pub new_fee_wallet: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct PricePoint {
    pub timestamp: i64,
    pub price: u64,
    pub volume: u64,
    pub market_cap: u64,
}

#[account]
pub struct StateAccount {
    pub authority: Pubkey,
    pub fee_wallet: Pubkey,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub market_cap: u64,
    pub graduated: bool,
    pub lp_locked: bool,
    pub timestamp: i64,
    pub lp_supply: u64,         // 20% of total supply for LP
    pub initial_price: u64,     // Initial token price
    pub current_price: u64,     // Current token price
    pub graduation_threshold: u64, // $100,000 in lamports
    pub fee_percentage: u8,     // 1% = 100
    pub last_update: i64,
}

impl StateAccount {
    pub const LEN: usize = 8 + 
        32 + // authority
        32 + // fee_wallet
        8 +  // total_supply
        8 + 
        8 +  // market_cap
        1 +  // graduated
        1 + 
        8 +  // timestamp
        8 +  // lp_supply
        8 +
        8 +  // current_price
        8 +  
        1 +  
        8;   
}

#[event]
pub struct TokensPurchased {
    amount: u64,
    price: u64,
    market_cap: u64,
}

#[event]
pub struct MarketGraduated {
    pub timestamp: i64,
    pub market_cap: u64,
    pub lp_amount: u64,
    pub final_price: u64,
}

#[event]
pub struct LPTokensBurned {
    pub timestamp: i64,
    pub amount: u64,
}

#[event]
pub struct FeeWalletUpdated {
    pub old_wallet: Pubkey,
    pub new_wallet: Pubkey,
}

#[event]
pub struct PriceUpdate {
    pub timestamp: i64,
    pub price: u64,
    pub volume: u64,
    pub market_cap: u64,
    pub transaction_type: TransactionType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum TransactionType {
    Buy,
    Sell,
}

#[error_code]
pub enum PumpError {
    MarketGraduated,
    PriceExceedsLimit,
    Overflow,
    AccountAlreadyInitialized,
    InvalidFeePercentage,
    PriceExceeds3x,
    InsufficientLiquidity,
    GraduationThresholdNotMet,
    LiquidityAlreadyLocked,
    Unauthorized,
    AlreadyGraduated,
    NotGraduated,
    LPNotLocked,
    NoLPTokens,
    InvalidFeeWallet,
}


fn calculate_price(_supply: u64, _amount: u64) -> Result<u64> {


    let base_price: u64 = 1_000_000; // 0.001 SOL in lamports
    let price_increase = _supply.checked_mul(100).unwrap_or(0);
    Ok(base_price.checked_add(price_increase).unwrap_or(base_price))
}

fn calculate_market_cap(supply: u64) -> Result<u64> {
    let price = calculate_price(supply, 1)?;
    Ok(price.checked_mul(supply).unwrap_or(0))
}


fn calculate_initial_price(market_cap: u64, supply: u64) -> Result<u64> {
    market_cap.checked_div(supply).ok_or(PumpError::Overflow.into())
}


fn calculate_fee(amount: u64, fee_percentage: u8) -> Result<u64> {
    amount
        .checked_mul(fee_percentage as u64)
        .ok_or(PumpError::Overflow)?
        .checked_div(10_000)
        .ok_or(PumpError::Overflow.into())
}


fn check_price_limit(current_price: u64, initial_price: u64) -> Result<()> {
    let max_price = initial_price.checked_mul(3).ok_or(PumpError::Overflow)?;
    require!(current_price <= max_price, PumpError::PriceExceeds3x);
    Ok(())
}


fn check_graduation(market_cap: u64, threshold: u64) -> bool {
    market_cap >= threshold
}
