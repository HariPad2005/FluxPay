
declare global {
    interface Window {
        ethereum: any;
    }
}

import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';

export async function setupWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Install MetaMask');
  }

  // Request accounts directly first to ensure we have one
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  return { walletClient, account };
}