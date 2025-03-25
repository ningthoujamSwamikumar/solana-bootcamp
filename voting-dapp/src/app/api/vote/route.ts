import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse, CreatePostResponseError } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@/../anchor/target/types/voting";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";

const IDL = require("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const metata: ActionGetResponse = {
    icon: "https://images.unsplash.com/photo-1742325989789-b42912a531dd?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Vote for your favorite peanut butter!",
    description: "Vote between 'Crunchy' and 'Smooth' peanut butter!",
    label: "Vote",
    links: {
      actions: [
        {
          href: "/api/vote?candidate=Crunchy", label: "Vote for Crunchy",
          type: "post"
        },
        {
          href: "/api/vote?candidate=Smooth", label: "Vote for Smooth",
          type: "post"
        },
      ]
    }
  };
  return Response.json(metata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate != "Smooth" && candidate != "Crunchy") {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const body: ActionPostRequest = await request.json();

  let voter;
  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid account!", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Voting> = new Program(IDL, { connection });

  const instruction = await program.methods.vote(new BN(1), candidate)
    .accounts({
      voter
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();
  const transaction = new Transaction({ feePayer: voter, blockhash: blockhash.blockhash, lastValidBlockHeight: blockhash.lastValidBlockHeight })
    .add(instruction);

  const response = await createPostResponse({ fields: { transaction: transaction, type: "transaction" } });
  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
