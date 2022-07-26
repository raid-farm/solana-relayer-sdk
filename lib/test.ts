import fs from "fs";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import Relayer from "./index";
async function main() {
  const config = {
    publicKey: "2Sz8EEgPbp1ouwwvZ6mCbVJdVqaG858pnL7SwoRBUipr",
    secretKey:
      "216,180,165,21,7,200,111,86,186,104,158,130,202,115,179,150,2,177,4,153,112,140,197,197,68,214,23,77,255,157,186,221,21,131,204,84,251,192,1,79,160,18,249,63,80,190,154,137,224,193,210,62,201,115,101,188,220,93,207,95,209,147,192,243",
  };
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(config.secretKey.split(",").map((x: any) => parseInt(x)))
  );

  const relayer = new Relayer(
    new Connection(clusterApiUrl("devnet")),
    keypair,
    {
      access: "faa63af2-7aca-41f8-9a37-40df76576828",
      secret: "6eed9011-0e9f-492f-9c56-ba7374302a0e",
    }
  );

  const txn = relayer.new();

  txn.add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: LAMPORTS_PER_SOL * 0.001,
    })
  );

  const x = await txn.send();
  console.log(x);
}

main();
