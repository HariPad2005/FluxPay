import { parseARPCResponse } from '@erc7824/nitrolite';

export function handleMessage(event) {
  const message = parseRPCResponse(event.data);

  switch (message.type) {
    case 'session_created':
      console.log('Session ready:', message.sessionId);
      break;

    case 'payment':
      console.log('Payment received:', message.amount);
      break;

    default:
      console.log('Message:', message);
  }
}
