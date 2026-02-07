import { createTransferMessage } from '@erc7824/nitrolite';

export async function sendPayment(
  ws: WebSocket,
  sessionSigner: any,
  amount: string,
  recipient: string,
  asset: string = 'ytest.usd'
) {
  const transferMsg = await createTransferMessage(sessionSigner, {
    destination: recipient as `0x${string}`,
    allocations: [{ asset, amount }],
  });
  ws.send(transferMsg);
  console.log('➡️ Payment sent');
}