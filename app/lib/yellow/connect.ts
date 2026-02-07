import WebSocket from 'ws';
import { parseRPCResponse } from '@erc7824/nitrolite';

export function connectClearnode(wsUrl: string) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ Connected to Yellow Network');
  };

  ws.onmessage = (event) => {
    const message = parseRPCResponse(event.data.toString());
    console.log('📥 Message:', message);
  };

  ws.onerror = console.error;

  return ws;
}
