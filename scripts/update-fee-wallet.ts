import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from '@solana/web3.js';
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

    // Load program
    const idl = JSON.parse(fs.readFileSync('./target/idl/pump.json', 'utf8'));
    const programId = new PublicKey("9ioKap41UwoQmff8DrkgcfMEkHXY5CzYRFhEAYLZPnmM");
    const program = new Program(idl, programId, provider);

    // Generate new fee wallet
    const newFeeWallet = Keypair.generate();
    const [statePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("state_v2")],
      programId
    );

    console.log("Updating fee wallet:");
    console.log("Authority:", deployerKeypair.publicKey.toString());
    console.log("State:", statePda.toString());
    console.log("New Fee Wallet:", newFeeWallet.publicKey.toString());

    const tx = await program.methods
      .updateFeeWallet(newFeeWallet.publicKey)
      .accounts({
        authority: deployerKeypair.publicKey,
        state: statePda,
        newFeeWallet: newFeeWallet.publicKey,
      })
      .signers([deployerKeypair])
      .rpc();

    console.log("Fee wallet updated! Transaction:", tx);

  } catch (error) {
    console.error("Error updating fee wallet:", error);
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