import { PublicKey, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

async function verifyProgramId() {
    try {
        // Read deployed keypair
        const keypairPath = path.join(__dirname, '../target/deploy/pump-keypair.json');
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
        const deployedProgramId = keypair.publicKey.toString();
        
        const results = new Map<string, string>();
        results.set('Deployed Program ID', deployedProgramId);
        
        // Check lib.rs
        const libRsPath = path.join(__dirname, '../programs/pump/src/lib.rs');
        const libRs = fs.readFileSync(libRsPath, 'utf-8');
        const declaredId = libRs.match(/declare_id!\("([^"]+)"\)/)?.[1];
        results.set('lib.rs declare_id', declaredId || 'Not found');
        
        // Check Anchor.toml
        const anchorTomlPath = path.join(__dirname, '../Anchor.toml');
        const anchorToml = fs.readFileSync(anchorTomlPath, 'utf-8');
        const anchorProgramId = anchorToml.match(/pump = "([^"]+)"/)?.[1];
        results.set('Anchor.toml program ID', anchorProgramId || 'Not found');
        
        // Check constants
        const constantsPath = path.join(__dirname, '../pumpfrontend/src/constants/index.ts');
        const constants = fs.readFileSync(constantsPath, 'utf-8');
        const constantProgramId = constants.match(/PROGRAM_ID = new PublicKey\("([^"]+)"\)/)?.[1];
        results.set('constants.ts PROGRAM_ID', constantProgramId || 'Not found');
        
        // Check .env.local
        const envPath = path.join(__dirname, '../pumpfrontend/.env.local');
        if (fs.existsSync(envPath)) {
            const envLocal = fs.readFileSync(envPath, 'utf-8');
            const envProgramId = envLocal.match(/NEXT_PUBLIC_PROGRAM_ID="([^"]+)"/)?.[1];
            results.set('.env.local PROGRAM_ID', envProgramId || 'Not found');
        }
        
        // Print results
        console.log('\nProgram ID Check Results:');
        console.log('========================');
        results.forEach((value, key) => {
            const match = value === deployedProgramId;
            console.log(`${key}: ${value} ${match ? '✅' : '❌'}`);
        });
        
        // Check if all match
        const allMatch = Array.from(results.values()).every(id => id === deployedProgramId);
        
        if (allMatch) {
            console.log('\n✅ All program IDs match!');
        } else {
            console.log('\n❌ Program ID mismatch detected!');
            console.log('Please update all files to use:', deployedProgramId);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error verifying program IDs:', error.message);
        } else {
            console.error('Error verifying program IDs:', error);
        }
        process.exit(1);
    }
}

verifyProgramId().catch(error => {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }
    process.exit(1);
}); 