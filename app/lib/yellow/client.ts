import {
  NitroliteClient,
  WalletStateSigner,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createGetLedgerBalancesMessage,
  createGetChannelsMessage,
} from '@erc7824/nitrolite';
import { createPublicClient, http, type WalletClient } from 'viem';
import { sepolia } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { connectClearnode } from './connect';
import { setupWalletClient } from './wallet';
import { parseMessage } from './messages';
import {
  openChannel as sessionOpenChannel,
  resizeChannel as sessionResizeChannel,
  closeChannel as sessionCloseChannel,
} from './session';
import { sendPayment } from './payments';
import 'dotenv/config';  

export class YellowClient {
  ws: WebSocket;
  account: string;
  walletClient: WalletClient;
  publicClient: any;
  client: NitroliteClient;
  sessionSigner: any;
  sessionAddress: string;
  isAuthenticated = false;

  constructor(
    ws: WebSocket,
    account: string,
    walletClient: any,
    publicClient: any
  ) {
    this.ws = ws;
    this.account = account;
    this.walletClient = walletClient;
    this.publicClient = publicClient;

    this.client = new NitroliteClient({
      publicClient,
      walletClient,
      stateSigner: new WalletStateSigner(walletClient),
      addresses: {
        custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
        adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
      },
      chainId: sepolia.id,
      challengeDuration: 3600n,
    });

    // Session Key Generation (ephemeral)
    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);
    this.sessionAddress = sessionAccount.address;
    this.sessionSigner = createECDSAMessageSigner(sessionPrivateKey);

    console.log(`[Yellow] Initialized for: ${this.account}`);
  }

  async authenticate() {
    return new Promise<void>(async (resolve, reject) => {
      const authParams = {
        session_key: this.sessionAddress as `0x${string}`,
        allowances: [{ asset: 'ytest.usd', amount: '1000000000' }],
        expires_at: BigInt(Math.floor(Date.now() / 1000) + 3600),
        scope: 'test.app',
      };

      const authRequestMsg = await createAuthRequestMessage({
        address: this.account as `0x${string}`,
        application: 'Test app',
        ...authParams,
      });

      const handler = async (event: MessageEvent) => {
        const msg = parseMessage(event);
        if (!msg) return;

        if (msg.type === 'auth_challenge') {
          if (this.isAuthenticated) return;

          const challenge = msg.payload.challenge_message;
          const signer = createEIP712AuthMessageSigner(this.walletClient, authParams, { name: 'Test app' });
          const verifyMsg = await createAuthVerifyMessageFromChallenge(signer, challenge);
          this.ws.send(verifyMsg);
        }

        if (msg.type === 'auth_verify') {
          console.log('[Yellow] ✓ Authenticated');
          this.isAuthenticated = true;
          this.ws.removeEventListener('message', handler);
          resolve();
        }
      };

      this.ws.addEventListener('message', handler);

      if (this.ws.readyState === WebSocket.OPEN) {
        console.log('[Yellow] Sending auth request');
        this.ws.send(authRequestMsg);
      } else {
        this.ws.onopen = () => this.ws.send(authRequestMsg);
      }
    });
  }

  async getBalance(asset: string = 'ytest.usd'): Promise<string> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = parseMessage(event);
        if (msg && msg.type === 'get_ledger_balances') {
          const balances = msg.payload.ledger_balances;
          console.log("balances", balances);
          const bal = balances.find((b: any) => b.asset === asset);
          this.ws.removeEventListener('message', handler);
          resolve(bal ? bal.amount : '0');
        }
      };
      this.ws.addEventListener('message', handler);
      createGetLedgerBalancesMessage(this.sessionSigner, this.account as `0x${string}`)
        .then(m => this.ws.send(m));
    });
  }

  // Wrappers for channel actions
  async openChannel(token: string) {
    return sessionOpenChannel(this.ws, this.sessionSigner, 11155111, token);
  }

  async resizeChannel(channelId: string, amount: bigint, destination: string) {
    return sessionResizeChannel(this.ws, this.sessionSigner, channelId, amount, destination);
  }

  async closeChannel(channelId: string) {
    return sessionCloseChannel(this.ws, this.sessionSigner, channelId, this.account);
  }

  async pay(amount: number, recipient: string) {
    return sendPayment(this.ws, this.sessionSigner, amount.toString(), recipient);
  }
}

export async function initYellow() {
  const { walletClient, account } = await setupWalletClient();
  const ws = connectClearnode('wss://clearnet-sandbox.yellow.com/ws');

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.ALCHEMY_RPC_URL), 
  });

  const client = new YellowClient(ws, account, walletClient, publicClient);
  await client.authenticate();
  await client.getBalance();

  return client;
}