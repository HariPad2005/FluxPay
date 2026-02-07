import { parseAnyRPCResponse } from '@erc7824/nitrolite';

export type MessageType =
  | 'auth_challenge'
  | 'auth_verify'
  | 'channels'
  | 'get_channels'
  | 'create_channel'
  | 'resize_channel'
  | 'close_channel'
  | 'get_ledger_balances'
  | 'transfer'
  | 'error';

export interface ParsedMessage {
  type: MessageType;
  payload: any;
  raw: any;
}

export function parseMessage(event: MessageEvent): ParsedMessage | null {
  try {
    const raw = JSON.parse(event.data.toString());
    const res = raw.res;
    const error = raw.error;

    if (error) {
      return { type: 'error', payload: error, raw };
    }

    if (res && Array.isArray(res)) {
      const type = res[1] as MessageType;
      // res[2] usually contains the payload
      return { type, payload: res[2], raw };
    }

    return null;
  } catch (e) {
    console.error('Failed to parse message:', e);
    return null;
  }
}