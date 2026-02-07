export async function setupMessageSigner() {
  if (!window.ethereum) throw new Error('Install MetaMask');

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  const userAddress = accounts[0];

  const messageSigner = async (message: string) => {
    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, userAddress],
    });
  };

  return { userAddress, messageSigner };
}
