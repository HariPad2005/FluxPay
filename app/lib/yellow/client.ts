import { connectClearnode } from './connect';
import { setupMessageSigner } from './wallet';
import { createPaymentSession } from './session';
import { sendPayment } from './payments';
import { handleMessage } from './messages';

export async function initYellow() {
  const ws = connectClearnode('wss://clearnet-sandbox.yellow.com/ws');

  const { userAddress, messageSigner } = await setupMessageSigner();

  ws.onmessage = handleMessage;

  return {
    ws,
    userAddress,
    messageSigner,
    createSession: (partner) =>
      createPaymentSession(ws, messageSigner, userAddress, partner),
    pay: (amount, partner) =>
      sendPayment(ws, messageSigner, amount, partner, async () => userAddress),
  };
}
