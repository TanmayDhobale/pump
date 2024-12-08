import * as anchor from "@project-serum/anchor";
import { 
  Keypair, 
  PublicKey, 
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  BPF_LOADER_PROGRAM_ID,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import * as fs from 'fs';

async function confirmWithRetry(connection: anchor.web3.Connection, signature: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await connection.confirmTransaction(signature, 'confirmed');
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retrying confirmation... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
    }
  }
}

async function loadChunk(
  connection: anchor.web3.Connection,
  deployerKeypair: Keypair,
  programKeypair: PublicKey,
  chunk: Buffer,
  offset: number,
  retries = 3
) {
  for (let i = 0; i < retries; i++) {
    try {
      const instruction = {
        keys: [
          { pubkey: programKeypair, isSigner: false, isWritable: true },
        ],
        programId: BPF_LOADER_PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([0]),
          Buffer.from(new Uint32Array([offset]).buffer),
          chunk,
        ]),
      };

      const loadTransaction = new Transaction().add({
        ...instruction,
        keys: instruction.keys.map((key) => ({
          ...key,
          isSigner: false,
          isWritable: true,
        })),
      });

      const loadSignature = await connection.sendTransaction(
        loadTransaction,
        [deployerKeypair],
        { 
          skipPreflight: true,
          preflightCommitment: 'confirmed',
        }
      );

      await confirmWithRetry(connection, loadSignature);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retrying chunk at offset ${offset}... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function main() {
  try {
    const connection = new anchor.web3.Connection(
      "https://api.devnet.solana.com",
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000, // 60 seconds
        wsEndpoint: "wss://api.devnet.solana.com/",
      }
    );

    const rawKey = fs.readFileSync('./id.json', 'utf-8');
    const deployerKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(rawKey))
    );
    const programSo = fs.readFileSync('./target/deploy/pump.so');
    const programKeypair = Keypair.generate();
    
    console.log("Program ID:", programKeypair.publicKey.toString());

    const space = programSo.length;
    const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(space);

    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: 1_400_000
    });

    const createAccountTransaction = SystemProgram.createAccount({
      fromPubkey: deployerKeypair.publicKey,
      newAccountPubkey: programKeypair.publicKey,
      lamports: rentExemptionAmount,
      space: space,
      programId: BPF_LOADER_PROGRAM_ID
    });

    const transaction = new Transaction()
      .add(modifyComputeUnits)
      .add(createAccountTransaction);

    console.log("Creating program account...");
    const signature = await connection.sendTransaction(
      transaction, 
      [deployerKeypair, programKeypair],
      {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      }
    );
    
    await confirmWithRetry(connection, signature);
    console.log("Program account created:", signature);
    const chunkSize = 900;
    const chunks = [];
    for (let i = 0; i < programSo.length; i += chunkSize) {
      chunks.push(programSo.slice(i, i + chunkSize));
    }

    console.log(`Loading ${chunks.length} chunks...`);
    for (let i = 0; i < chunks.length; i++) {
      await loadChunk(
        connection,
        deployerKeypair,
        programKeypair.publicKey,
        chunks[i],
        i * chunkSize
      );
      console.log(`Chunk ${i + 1}/${chunks.length} loaded`);
      
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("Program deployed successfully!");

    let anchorToml = fs.readFileSync('./Anchor.toml', 'utf8');
    anchorToml = anchorToml.replace(
      /pump = "[^"]*"/,
      `pump = "${programKeypair.publicKey.toString()}"`
    );
    fs.writeFileSync('./Anchor.toml', anchorToml);
    

    fs.writeFileSync(
      './target/deploy/pump-keypair.json',
      JSON.stringify(Array.from(programKeypair.secretKey))
    );

  } catch (error) {
    console.error("Deployment failed:", error);
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    process.exit(1);
  }
}

main().catch(console.error); 