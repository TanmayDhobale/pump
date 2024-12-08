import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { 
  Keypair, 
  SystemProgram, 
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import * as fs from 'fs';

async function main() {
  try {
    const connection = new anchor.web3.Connection(
      "https://api.devnet.solana.com",
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }
    );

    const rawKey = fs.readFileSync('./id.json', 'utf-8');
    const deployerKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(rawKey))
    );

    const programSo = fs.readFileSync('./target/deploy/pump.so');
    

    const space = programSo.length;
    const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(space);
    

    const totalLamports = rentExemptionAmount + LAMPORTS_PER_SOL;


    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000
    });

    const modifyComputeUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 50
    });

    const transaction = new Transaction()
      .add(modifyComputeUnits)
      .add(modifyComputeUnitPrice);


    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [deployerKeypair],
      {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
        confirmation: 'confirmed',
      }
    );

    console.log("Deployment successful! Signature:", signature);

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main(); 