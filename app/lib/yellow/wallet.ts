import { createWalletClient, custom, getAddress } from 'viem';
import { sepolia } from 'viem/chains';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function setupWalletClient() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Install MetaMask');
  }

  // Request accounts
  const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const account = getAddress(address); // Ensure checksum address

  // Switch to Sepolia
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    } else {
      console.error("Failed to switch chain", error);
    }
  }

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: custom(window.ethereum),
  });

  return { walletClient, account };
}