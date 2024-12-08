import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { 
  Keypair, 
  PublicKey, 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from 'fs';

async function main() {
  try {
    const connection = new anchor.web3.Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const rawKey = fs.readFileSync('./id.json', 'utf-8');
    const deployerKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(rawKey))
    );

    const wallet = new anchor.Wallet(deployerKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    anchor.setProvider(provider);
    const idl = JSON.parse(fs.readFileSync('./target/idl/pump.json', 'utf8'));
    const programId = new PublicKey("4qKuYQJ9hMGH8gqj1UWLPAYxNHxVvabz4kwSuE52in7f");
    const program = new Program(idl, programId, provider);

    const mintAddress = new PublicKey("ASrh692FC9qTqV84ux1UEezAs1kQL4HVGQaxmZrfe6gR");
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state_v2")],
      programId
    );

    const lpTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      statePda,
      true
    );

    console.log("Burning LP tokens with accounts:");
    console.log("Authority:", deployerKeypair.publicKey.toString());
    console.log("State:", statePda.toString());
    console.log("Mint:", mintAddress.toString());
    console.log("LP Token Account:", lpTokenAccount.toString());

    // Burn LP tokens
    const tx = await program.methods
      .burnLpTokens()
      .accounts({
        authority: deployerKeypair.publicKey,
        state: statePda,
        mint: mintAddress,
        lpTokenAccount: lpTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([deployerKeypair])
      .rpc();

    console.log("LP tokens burned! Transaction:", tx);

  } catch (error) {
    console.error("Error burning LP tokens:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if ('logs' in error) {
        console.error("Transaction logs:", error.logs);
      }
    }
    process.exit(1);
  }
}

main(); 