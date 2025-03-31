'use client'

import { getCruddappProgram, getCruddappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

interface CreateJournalArgs {
  title: string;
  content: string;
  writer: PublicKey;
}

export function useCruddappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCruddappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCruddappProgram(provider, programId), [provider, programId])

  const journals = useQuery({
    queryKey: ['cruddapp', 'all', { cluster }],
    queryFn: () => program.account.journal.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createJournal = useMutation<string, Error, CreateJournalArgs>({
    mutationKey: ['cruddapp', 'create', { cluster }],
    mutationFn: ({ content, title, writer }) =>
      program.methods.createJournal(title, content).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return journals.refetch()
    },
    onError: () => toast.error('Failed to create journal'),
  })

  return {
    program,
    programId,
    accounts: journals,
    getProgramAccount,
    createJournal,
  }
}

export function useCruddappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCruddappProgram()

  const accountQuery = useQuery({
    queryKey: ['cruddapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.journal.fetch(account),
  })

  const updateJournal = useMutation<string, Error, CreateJournalArgs>({
    mutationKey: ['cruddapp', 'update', { cluster }],
    mutationFn: ({ content, title, writer }) =>
      program.methods.updateJournal(title, content).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to update journal'),
  });

  const deleteJournal = useMutation<string, Error, string>({
    mutationKey: ['cruddapp', 'create', { cluster }],
    mutationFn: (title) =>
      program.methods.deleteJournal(title).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to delete journal'),
  });

  return {
    accountQuery,
    updateJournal,
    deleteJournal
  }
}
