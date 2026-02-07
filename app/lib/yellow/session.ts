import {
  createCreateChannelMessage,
  createResizeChannelMessage,
  createCloseChannelMessage,
} from '@erc7824/nitrolite';

export async function openChannel(
  ws: WebSocket,
  sessionSigner: any,
  chainId: number = 11155111,
  token: string
) {
  const createMsg = await createCreateChannelMessage(sessionSigner, {
    chain_id: chainId,
    token: token as `0x${string}`,
  });
  ws.send(createMsg);
  console.log('➡️ Open channel request sent');
}

export async function resizeChannel(
  ws: WebSocket,
  sessionSigner: any,
  channelId: string,
  amount: bigint,
  destination: string
) {
  const msg = await createResizeChannelMessage(sessionSigner, {
    channel_id: channelId as `0x${string}`,
    allocate_amount: amount,
    funds_destination: destination as `0x${string}`,
  });
  ws.send(msg);
  console.log('➡️ Resize channel request sent');
}

export async function closeChannel(
  ws: WebSocket,
  sessionSigner: any,
  channelId: string,
  userAddress: string
) {
  const msg = await createCloseChannelMessage(
    sessionSigner,
    channelId as `0x${string}`,
    userAddress as `0x${string}`
  );
  ws.send(msg);
  console.log('➡️ Close channel request sent');
}