import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Voting } from '../target/types/voting';
import { BankrunProvider, startAnchor } from 'anchor-bankrun';

const IDL = require("../target/idl/voting.json");
const voting_dapp_address = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

describe('votingdapp', () => {

  let context;
  let provider;
  let votingProgram: anchor.Program<Voting>;

  beforeAll(async () => {
    // Configure the client to use the local cluster.
    context = await startAnchor("", [{ name: "votingdapp", programId: voting_dapp_address }], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(IDL, provider);
  });

  it("initialize poll", async () => {
    await votingProgram.methods.initializePoll(new anchor.BN(1), "what is your favorite type of peanut butter?", new anchor.BN(1742839630), new anchor.BN(1743039630)).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync([Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)], voting_dapp_address);

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("poll created: ", poll);

    expect(poll.id.toNumber()).toEqual(new anchor.BN(1).toNumber());
    expect(poll.description).toEqual("what is your favorite type of peanut butter?");
    expect(poll.startTime.toNumber()).toBeLessThan(poll.endTime.toNumber());
  });

  it("initialize candidate", async () => {
    await votingProgram.methods.initializeCandidate(new anchor.BN(1), "Smooth").rpc();
    await votingProgram.methods.initializeCandidate(new anchor.BN(1), "Crunchy").rpc();

    const [pollAddress, _bump] = PublicKey.findProgramAddressSync([Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)], voting_dapp_address);
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("poll: ", poll);

    const [smoothCandAddr] = PublicKey.findProgramAddressSync([Buffer.from("candidate"), pollAddress.toBuffer(), Buffer.from("Smooth")], voting_dapp_address);
    const cand_smooth = await votingProgram.account.candidate.fetch(smoothCandAddr);
    console.log("smooth candidate:", cand_smooth);
    expect(cand_smooth.name).toEqual("Smooth");
    expect(cand_smooth.vote.toNumber()).toEqual(0);
    
    const [crunchyCandAddr] = PublicKey.findProgramAddressSync([Buffer.from("candidate"), pollAddress.toBuffer(), Buffer.from("Crunchy")], voting_dapp_address);
    const cand_crunchy = await votingProgram.account.candidate.fetch(crunchyCandAddr);
    console.log("crunchy candidate: ", cand_crunchy);
    expect(cand_crunchy.name).toEqual("Crunchy");
    expect(cand_crunchy.vote.toNumber()).toEqual(0);
  });

  it("vote", async () => {
    await votingProgram.methods.vote(new anchor.BN(1), "Smooth").rpc();
    
    const [pollAddress] = PublicKey.findProgramAddressSync([Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)], voting_dapp_address);
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("poll in vote test: ", poll);

    const [smoothCandAddr] = PublicKey.findProgramAddressSync([Buffer.from("candidate"), pollAddress.toBuffer(), Buffer.from("Smooth")], voting_dapp_address);
    const smoothCand = await votingProgram.account.candidate.fetch(smoothCandAddr);
    console.log("smooth candidate after vote", smoothCand);

    expect(smoothCand.vote.toNumber()).toEqual(1);
  });

})
