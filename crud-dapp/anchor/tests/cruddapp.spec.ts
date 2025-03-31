import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { Cruddapp } from '../target/types/cruddapp'

describe('cruddapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.Cruddapp as Program<Cruddapp>

  it('create journal', async () => {
    expect((await program.account.journal.all()).length).toEqual(0);
    await program.methods
      .createJournal("test_journal_title", "this is the content of test journal")
      .rpc();
    const currentJournal = await program.account.journal.all();
    expect(currentJournal[0].account.title).toEqual("test_journal_title");
  })

  it('update journal', async () => {
    expect((await program.account.journal.all()).length).toEqual(1);
    const updatedContent = "this is the updated content of the test journal";
    await program.methods.updateJournal("test_journal_title", updatedContent).rpc();

    const journals = await program.account.journal.all();
    expect(journals[0].account.content).toEqual(updatedContent);
  });

  it('delete journal', async () => {
    expect((await program.account.journal.all()).length).toEqual(1);
    await program.methods.deleteJournal("test_journal_title").rpc();
    expect((await program.account.journal.all()).length).toEqual(0);
  })

})