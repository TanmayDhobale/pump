import { PublicKey } from '@solana/web3.js';

// Program ID is fixed
export const PROGRAM_ID = new PublicKey("4qKuYQJ9hMGH8gqj1UWLPAYxNHxVvabz4kwSuE52in7f");

// Mint address is fixed
export const MINT_ADDRESS = new PublicKey("ASrh692FC9qTqV84ux1UEezAs1kQL4HVGQaxmZrfe6gR");

// Calculate the state PDA
const [statePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("state_v2")],
  PROGRAM_ID
);

export const STATE_ADDRESS = statePda;
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

