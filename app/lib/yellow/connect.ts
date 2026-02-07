
import { parseAnyRPCResponse } from '@erc7824/nitrolite';

export function connectClearnode(wsUrl: string) {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ Connected to Yellow Network');
  };

  ws.onmessage = (event) => {
    const message = parseAnyRPCResponse(event.data.toString());
    console.log('📥haris Message:', message);
  };

  ws.onerror = console.error;

  return ws;
}
