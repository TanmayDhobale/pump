import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Pump } from "../target/types/pump";

describe("pump", () => {
  const programId = new anchor.web3.PublicKey("9ioKap41UwoQmff8DrkgcfMEkHXY5CzYRFhEAYLZPnmM");
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Pump as Program<Pump>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
