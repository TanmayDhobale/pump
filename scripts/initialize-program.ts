import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    // Setup connection
    const connection = new anchor.web3.Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    // Load deployer keypair
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
    const idlPath = path.join(__dirname, '../target/idl/pump.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const programId = new PublicKey("4qKuYQJ9hMGH8gqj1UWLPAYxNHxVvabz4kwSuE52in7f");
    const program = new Program(idl, programId, provider);

    // Setup accounts
    const mintAddress = new PublicKey("ASrh692FC9qTqV84ux1UEezAs1kQL4HVGQaxmZrfe6gR");
    const feeWallet = Keypair.generate();
    const timestamp = new anchor.BN(Date.now() / 1000);

    // Find PDA
    const [statePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("state_v2")],
      programId
    );

    console.log("Initializing with accounts:");
    console.log("Program ID:", programId.toString());
    console.log("Authority:", deployerKeypair.publicKey.toString());
    console.log("State PDA:", statePda.toString());
    console.log("Mint:", mintAddress.toString());
    console.log("Fee Wallet:", feeWallet.publicKey.toString());
    console.log("Timestamp:", timestamp.toString());
    console.log("Bump:", bump);

    // Initialize program
    const tx = await program.methods
      .initialize(
        feeWallet.publicKey,
        new anchor.BN("1000000000"),
        timestamp
      )
      .accounts({
        authority: deployerKeypair.publicKey,
        state: statePda,
        mint: mintAddress,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([deployerKeypair])
      .rpc();

    console.log("Program initialized! Transaction:", tx);

    // Save configuration
    const envContent = `
NEXT_PUBLIC_PROGRAM_ID=${programId.toString()}
NEXT_PUBLIC_MINT_ADDRESS=${mintAddress.toString()}
NEXT_PUBLIC_STATE_ADDRESS=${statePda.toString()}
NEXT_PUBLIC_FEE_WALLET=${feeWallet.publicKey.toString()}
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
`;

    fs.writeFileSync('./pumpfrontend/.env.local', envContent);
    console.log("Environment variables saved to pumpfrontend/.env.local");

  } catch (error) {
    console.error("Error initializing program:", error);
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