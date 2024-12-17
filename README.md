# Pump.Fun Smart Contract

https://github.com/user-attachments/assets/b50358b0-81ad-4f86-aaf0-1bf0e62e49e2

Core Requirements
------------------

### Market Cap and Supply

- **Base Market Cap**: $42,000
- **Token Supply**: 1 billion tokens
  - 80% of the token supply is sold via bonding.
  - 20% of the token supply is reserved for liquidity.

### Graduation Rules

- A token “graduates” when its market cap reaches $100,000.
- After graduation:
  - 20% of the total supply is moved to the LP.
  - Liquidity is locked and burned to ensure safety.

### Buy and Sell Fees

- Deduct a 1% fee on both buy and sell transactions.
- Send the fees to a designated fee wallet.

### Price Restrictions

- Set an initial market cap to ensure the token price.

### Real-Time Chart Updates

- Track all buy and sell transactions and display them on the chart.
- Update the chart dynamically with every new transaction.

Technical Specifications
------------------------

### Smart Contract Functionalities

#### Token Sales via Bonding Curve

- Implement a mechanism to buy and sell tokens using a bonding curve.
- Calculate prices based on the current market cap and token supply.

#### Fees Management

- Deduct a 1% fee from all transactions.
- Send the fee amount to a fee wallet address stored in the contract.
- Allow the fee wallet address to be updated by the contract owner.

#### Liquidity Management

- When the market cap reaches $100,000:
  - Automatically deposit 20% of the total token supply into liquidity pools.
