import { createAppSessionMessage } from '@erc7824/nitrolite';

export async function createPaymentSession(
  ws: WebSocket,
  messageSigner,
  userAddress: string,
  partnerAddress: string
) {
  const appDefinition = {
    protocol: 'payment-app-v1',
    participants: [userAddress, partnerAddress],
    weights: [50, 50],
    quorum: 100,
    challenge: 0,
    nonce: Date.now(),
  };

  const allocations = [
    { participant: userAddress, asset: 'usdc', amount: '800000' },
    { participant: partnerAddress, asset: 'usdc', amount: '200000' },
  ];

  const sessionMessage = await createAppSessionMessage(
    messageSigner,
    [{ definition: appDefinition, allocations }]
  );

  ws.send(sessionMessage);
  console.log('✅ Session created');
}
