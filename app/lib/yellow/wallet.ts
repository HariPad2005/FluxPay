import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
  getAddress,
} from 'viem'

import { useAccount, useEnsAvatar, useEnsName } from 'wagmi'

import { sepolia } from 'viem/chains'

declare global {
  interface Window {
    ethereum?: any;
  }
}


export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http('https://rpc.sepolia.org'),
})

/**
 * Reverse resolve address -> ENS name
 */
export async function resolveEnsName(address: `0x${string}`) {
  try {
    return await publicClient.getEnsName({ address })
  } catch {
    return null
  }
}

/**
 * Resolve ENS name -> address
 */
export async function resolveEnsAddress(name: string) {
  try {
    return await publicClient.getEnsAddress({ name })
  } catch {
    return null
  }
}

/**
 * Get ENS profile (name + avatar)
 */
export async function getEnsProfile(address: `0x${string}`) {
  try {
    const name = await publicClient.getEnsName({ address })

    if (!name) {
      return {
        name: null,
        avatar: null,
      }
    }

    const avatar = await publicClient.getEnsAvatar({ name })

    return {
      name,
      avatar,
    }
  } catch {
    return {
      name: null,
      avatar: null,
    }
  }
}


export async function setupWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Install MetaMask')
  }

  /* ---------- Request wallet ---------- */
  const [address] = await window.ethereum.request({
    method: 'eth_requestAccounts',
  })

  const account = getAddress(address)

  /* ---------- Switch to Sepolia ---------- */
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'SEP',
            decimals: 18,
          },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
    }
  }

  /* ---------- Wallet client ---------- */
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: custom(window.ethereum),
  })

  // const ens = await getEnsProfile(account)
  const { data: name } = useEnsName({ address, chainId: 11155111 })
  const { data: avatar } = useEnsAvatar({ name, chainId: 11155111 })
  console.log('ENS Profile:', name, avatar)

  return {
    walletClient,
    publicClient,

    account,
    ensName: name,
    ensAvatar: avatar,
  }
}
