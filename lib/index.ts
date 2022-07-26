import {
  Connection,
  Keypair,
  Transaction,
  clusterApiUrl,
  PublicKey,
  TransactionInstruction,
  TransactionInstructionCtorFields,
} from "@solana/web3.js";
import fetch from "node-fetch";
import Base58 from "bs58";
export default class Relayer {
  connection: Connection;
  keypair: Keypair;
  transactions: (
    | Transaction
    | TransactionInstruction
    | TransactionInstructionCtorFields
  )[] = [];
  config: {
    access: string;
    secret: string;
  };

  constructor(
    connection: Connection,
    keypair: Keypair,
    config: { access: string; secret: string }
  ) {
    this.connection = connection;
    this.keypair = keypair;
    this.config = config;
  }

  new() {
    return new TransactionClass(this.connection, this.keypair, this.config);
  }
}

class TransactionClass {
  transactions: (
    | Transaction
    | TransactionInstruction
    | TransactionInstructionCtorFields
  )[] = [];
  connection: Connection;
  keypair: Keypair;
  config: {
    access: string;
    secret: string;
  };

  constructor(
    connection: Connection,
    keypair: Keypair,
    config: { access: string; secret: string }
  ) {
    this.connection = connection;
    this.keypair = keypair;
    this.config = config;
  }

  add(
    ...txns: (
      | Transaction
      | TransactionInstruction
      | TransactionInstructionCtorFields
    )[]
  ) {
    this.transactions.push(...txns);
  }

  async send() {
    let connection = new Connection(clusterApiUrl("devnet"));
    const x = await connection.getLatestBlockhash();
    const pk = await fetch("https://raid-solana-relayer.vercel.app/api/sdk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access: this.config.access,
        secret: this.config.secret,
      }),
    })
      .then(async (res) => await res.json())
      .then((res: any) => {
        if (res.success) {
          return res.publicKey;
        }
        throw new Error("Failed to get relayer public key");
      });
    let transaction = new Transaction({
      feePayer: new PublicKey(pk),
      ...x,
    });
    transaction.add(...this.transactions);
    transaction.partialSign(this.keypair);
    if (transaction.signatures[1].signature) {
      const signature = transaction.signatures[1].signature;
      return await fetch("https://raid-solana-relayer.vercel.app/api/tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access: this.config.access,
          secret: this.config.secret,
          signature: Base58.encode(signature),
          tx: transaction.compileMessage().serialize().toString("base64"),
          from: this.keypair.publicKey.toString(),
        }),
      })
        .then(async (res) => {
          const x: any = await res.json();
          if (x.success) {
            return x.result;
          } else {
            throw new Error("failed");
          }
        })
        .catch((err) => {
          throw new Error(err);
        });
    } else {
      throw new Error("Failed to sign transaction");
    }
  }
}
