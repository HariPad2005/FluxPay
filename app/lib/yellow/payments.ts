export async function sendPayment(
  ws: WebSocket,
  messageSigner,
  amount: number,
  recipient: string,
  getCurrentUserAddress
) {
  const paymentData = {
    type: 'payment',
    amount: amount.toString(),
    recipient,
    timestamp: Date.now(),
  };

  const signature = await messageSigner(JSON.stringify(paymentData));

  const signedPayment = {
    ...paymentData,
    signature,
    sender: await getCurrentUserAddress(),
  };

  ws.send(JSON.stringify(signedPayment));
  console.log('➡️ Payment sent');
}
