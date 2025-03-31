'use client'

import { Keypair, PublicKey } from '@solana/web3.js'
import { FormEvent, useMemo, useState } from 'react'
import { ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useCruddappProgram, useCruddappProgramAccount } from './cruddapp-data-access'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

export function CruddappCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { publicKey: user } = useWallet();
  const { createJournal } = useCruddappProgram();

  if (!user) {
    toast("Please connect your wallet!");
    return (<div>
      Oops! Something went wrong.
    </div>);
  }

  const isFormValid = title.trim() !== '' && content.trim() !== '';

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user && isFormValid) {
      createJournal.mutateAsync({ title, content, writer: user });
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor='title'>Title</label>
        <input onChange={(e) => setTitle(e.target.value)} id='title' />
        <label htmlFor='content'>Content</label>
        <textarea onChange={(e) => setContent(e.target.value)} />
        <button
          className="btn btn-xs lg:btn-md btn-primary"
          type='submit'
          disabled={createJournal.isPending}
        >
          Create {createJournal.isPending && '...'}
        </button>
      </form>
    </div>
  )
}

export function CruddappList() {
  const { accounts, getProgramAccount } = useCruddappProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <CruddappCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CruddappCard({ account }: { account: PublicKey }) {
  const { publicKey: user } = useWallet();
  const [content, setContent] = useState("");

  const { accountQuery, deleteJournal, updateJournal } = useCruddappProgramAccount({
    account,
  });

  const title = useMemo(() => accountQuery.data?.title ?? "", [accountQuery.data?.title]);

  const isFormValid = content.trim() !== '';

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user && isFormValid) {
      updateJournal.mutateAsync({ title, content, writer: user });
    }
  };

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2 className="card-title justify-center text-3xl cursor-pointer" onClick={() => accountQuery.refetch()}>
            {title}
          </h2>
          <p>{accountQuery.data?.content}</p>
          <div className="card-actions justify-around">
            <form onSubmit={handleSubmit}>
              <label htmlFor='content'>Content</label>
              <textarea placeholder='write your updated content here' onChange={(e) => setContent(e.target.value)} />
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                type='submit'
                disabled={updateJournal.isPending}
              >
                Update Journal {updateJournal.isPending && '...'}
              </button>
            </form>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (!window.confirm('Are you sure you want to close this account?')) {
                  return
                }
                if (!accountQuery.data?.title) {
                  toast("Invalid title!");
                  return;
                }
                return deleteJournal.mutateAsync(accountQuery.data.title)
              }}
              disabled={deleteJournal.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
