import { execSync } from 'child_process';
import * as fs from 'fs';

async function main() {
  try {

    const programKeypair = JSON.parse(fs.readFileSync('target/deploy/pump-keypair.json', 'utf-8'));
    const programId = programKeypair.toString();
    
    console.log("Deploying program with ID:", programId);

    const deployCommand = `solana program deploy \
      --program-id target/deploy/pump-keypair.json \
      --keypair ./id.json \
      --url devnet \
      target/deploy/pump.so`;

    console.log("Executing deploy command...");
    const output = execSync(deployCommand, { encoding: 'utf-8' });
    console.log("Deploy output:", output);

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main(); 