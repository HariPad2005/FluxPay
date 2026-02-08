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

  ensName: string | null;
  ensAvatar: string | null;

  isAuthenticated = false;
  lastChannelId?: string;


  /* ======================================================
     CONSTRUCTOR
  ====================================================== */

  constructor(
    ws: WebSocket,
    account: string,
    walletClient: any,
    publicClient: any,
    ensName: string | null,
    ensAvatar: string | null,
  ) {
    this.ws = ws;
    this.account = account;
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.ensName = ensName;
    this.ensAvatar = ensAvatar;

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

    /* ---------- Session key ---------- */
    const sessionPrivateKey = generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    this.sessionAddress = sessionAccount.address;
    this.sessionSigner = createECDSAMessageSigner(sessionPrivateKey);

    console.log(`[Yellow] Initialized for: ${this.account}`);

    /* ======================================================
       🔥 GLOBAL CHANNEL LISTENER (CRITICAL)
       Handles ALL Nitro channel events automatically
    ====================================================== */

    this.ws.addEventListener('message', async (event) => {
      const msg = parseMessage(event);
      if (!msg) return;

      // only channel related messages
      if (
        msg.type !== 'create_channel' &&
        msg.type !== 'resize_channel' &&
        msg.type !== 'close_channel' &&
        msg.type !== 'transfer'
      )
        return;

      console.log('📥 WS:', msg.type);

      /* ---------- Create channel → on-chain deploy ---------- */
      if (msg.type === 'create_channel') {
        const { channel_id, channel, state, server_signature } = msg.payload;
        this.lastChannelId = channel_id;
        const unsignedInitialState = {
          intent: state.intent,
          version: BigInt(state.version),
          data: state.state_data,
          allocations: state.allocations.map((a: any) => ({
            destination: a.destination,
            token: a.token,
            amount: BigInt(a.amount),
          })),
        };

        const tx = await this.client.createChannel({
          channel,
          unsignedInitialState,
          serverSignature: server_signature,
        });

        console.log('✅ Channel created on-chain:', tx);
      }

      /* ---------- Resize confirmed ---------- */
      if (msg.type === 'resize_channel') {
        console.log('✅ Channel funded');
      }

      /* ---------- Close → FINAL SETTLEMENT ---------- */
      // if (msg.type === 'close_channel') {
      //   console.log('🟡 Node signed close → settling on-chain');

      //   const finalState = {
      //     intent: msg.payload.state.intent,
      //     version: BigInt(msg.payload.state.version),
      //     data: msg.payload.state.state_data,
      //     allocations: msg.payload.state.allocations.map((a: any) => ({
      //       destination: a.destination,
      //       token: a.token,
      //       amount: BigInt(a.amount),
      //     })),
      //     channelId: msg.payload.channel_id,
      //     serverSignature: msg.payload.server_signature,
      //   };

      //   await this.finalizeClose(finalState);

      // }

      // Handle Transfer
      if (msg.type === 'transfer') {
        console.log('✅ Off-chain payment successful (ledger updated)');
      }


      // Handle Errors
      // if (msg.error) {
      //     console.error(`[Alice] Error:`, msg.error);
      //     if (msg.error.message.includes('non-zero allocation')) {
      //         // Try to recover? For now fail
      //         reject(msg.error);
      //     }
      // }
    });
  }

  /* ======================================================
     AUTH
  ====================================================== */

  async authenticate() {
    return new Promise<void>(async (resolve) => {
      console.log('🟡 Authenticating...');

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
          const signer = createEIP712AuthMessageSigner(
            this.walletClient,
            authParams,
            { name: 'Test app' }
          );

          const verifyMsg = await createAuthVerifyMessageFromChallenge(
            signer,
            msg.payload.challenge_message
          );

          this.ws.send(verifyMsg);
        }

        if (msg.type === 'auth_verify') {
          console.log('✅ Authenticated');
          this.ws.removeEventListener('message', handler);
          this.isAuthenticated = true;
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

  /* ======================================================
     BALANCES
  ====================================================== */

  async getBalance(asset: string = 'ytest.usd'): Promise<string> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = parseMessage(event);
        if (msg?.type === 'get_ledger_balances') {
          this.ws.removeEventListener('message', handler);

          const balances = msg.payload.ledger_balances;

          console.log('\n📊 Ledger Balances');
          balances.forEach((b: any) => {
            console.log(`   ${b.asset}: ${b.amount}`);
          });

          const bal = balances.find((b: any) => b.asset === asset);
          resolve(bal?.amount || '0');
        }
      };

      this.ws.addEventListener('message', handler);

      createGetLedgerBalancesMessage(
        this.sessionSigner,
        this.account as `0x${string}`
      ).then(m => this.ws.send(m));
    });
  }

  async getRecipientBalance(recipient: string, asset: string = 'ytest.usd') {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = parseMessage(event);
        console.log('recipient msg', msg);
        if (msg?.type === 'get_ledger_balances') {
          this.ws.removeEventListener('message', handler);

          const balances = msg.payload.ledger_balances;

          console.log(`\n📊 Recipient (${recipient}) Ledger`);
          if (!balances.length) {
            console.log('   ytest.usd: 0');
          } else {
            balances.forEach((b: any) => {
              console.log(`   ${b.asset}: ${b.amount}`);
            });
          }
          const bal = balances.find((b: any) => b.asset === asset);
          resolve(bal?.amount || '0');
        }
      };

      this.ws.addEventListener('message', handler);

      createGetLedgerBalancesMessage(
        this.sessionSigner,
        recipient as `0x${string}`
      ).then(m => this.ws.send(m));
    });
  }


  /* ======================================================
     NITRO (ON-CHAIN OPS)
  ====================================================== */

  async deposit(token: `0x${string}`, amount: bigint) {
    console.log('🟡 Depositing...');
    return this.client.deposit(token, amount);
  }

  async getCustodyBalance(token: `0x${string}`): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: this.client.addresses.custody,
      abi: [{
        type: 'function',
        name: 'getAccountsBalances',
        inputs: [
          { name: 'users', type: 'address[]' },
          { name: 'tokens', type: 'address[]' }
        ],
        outputs: [{ type: 'uint256[]' }],
        stateMutability: 'view'
      }] as const,
      functionName: 'getAccountsBalances',
      args: [[this.account], [token]],
    }) as bigint[];

    return result[0];
  }

  async requestChannels(): Promise<string | undefined> {
    return new Promise(async (resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = parseMessage(event);
        if (!msg) return;

        if (msg.type === 'channels' || msg.type === 'get_channels') {
          this.ws.removeEventListener('message', handler);

          const channels = msg.payload.channels || [];

          const open = channels.find((c: any) => c.status === 'open');

          if (open) {
            this.lastChannelId = open.channel_id;
            console.log('✅ Reusing existing channel:', this.lastChannelId);
            resolve(this.lastChannelId);
          } else {
            console.log('ℹ️ No existing channel');
            resolve(undefined);
          }
        }
      };

      this.ws.addEventListener('message', handler);

      const req = await createGetChannelsMessage(
        this.sessionSigner,
        this.account as `0x${string}`
      );

      this.ws.send(req);
    });
  }


  async finalizeClose(finalState: any) {
    const txHash = await this.client.closeChannel({
      finalState,
      stateData: '0x',
    });

    console.log('🟡 Settlement tx submitted:', txHash);

    await this.publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log('🎉 On-chain settlement confirmed');

    return txHash;
  }

  /* ======================================================
     WRAPPERS (UNCHANGED)
  ====================================================== */

  async openChannel(token: string) {
    return sessionOpenChannel(this.ws, this.sessionSigner, 11155111, token);
  }

  async resizeChannel(channelId: string, amount: bigint, destination: string) {
    return sessionResizeChannel(this.ws, this.sessionSigner, channelId, amount, destination);
  }

  async closeChannel(channelId: string) {
    return new Promise<void>(async (resolve) => {

      const handler = async (event: MessageEvent) => {
        const msg = parseMessage(event);
        if (!msg) return;

        if (msg.type === 'close_channel') {
          this.ws.removeEventListener('message', handler);

          const finalState = {
            intent: msg.payload.state.intent,
            version: BigInt(msg.payload.state.version),
            data: msg.payload.state.state_data,
            allocations: msg.payload.state.allocations.map((a: any) => ({
              destination: a.destination,
              token: a.token,
              amount: BigInt(a.amount),
            })),
            channelId: msg.payload.channel_id,
            serverSignature: msg.payload.server_signature,
          };

          await this.finalizeClose(finalState);

          resolve();
        }
      };

      this.ws.addEventListener('message', handler);

      await sessionCloseChannel(this.ws, this.sessionSigner, channelId, this.account);
    });
  }


  async pay(amount: number, recipient: string) {
    return sendPayment(this.ws, this.sessionSigner, amount.toString(), recipient);
  }

  /* ======================================================
   FLOW EXECUTOR (SEQUENTIAL STEPS)
   Call this from frontend
====================================================== */

  async executePaymentFlow(
    token: `0x${string}`,
    depositAmount: bigint,
    fundAmount: bigint,
    payAmount: number,
    recipient: string
  ) {
    console.log('\n=== Yellow Flow Start ===');

    console.log('--- Sender ledger BEFORE ---');
    await this.getBalance();

    console.log('--- Recipient ledger BEFORE ---');
    await this.getRecipientBalance(recipient);


    const custody = await this.getCustodyBalance(token);
    console.log('custody before:', custody);
    console.log('STEP 1 → Check wallet balance');

    const l1Balance = await this.publicClient.readContract({
      address: token,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view'
      }] as const,
      functionName: 'balanceOf',
      args: [this.account],
    }) as bigint;

    console.log('wallet token balance:', l1Balance.toString());

    /* ---------- deposit only if needed ---------- */
    if (l1Balance >= depositAmount && depositAmount > 0n) {
      console.log('Depositing to custody...');
      await this.deposit(token, depositAmount);
    } else {
      console.log('Skipping deposit');
    }

    console.log('STEP 2 → Open channel');
    await this.requestChannels();

    // await new Promise(r => setTimeout(r, 2000));
    console.log(this.lastChannelId);
    if (!this.lastChannelId) {
      await this.openChannel(token);
    }


    await new Promise(r => setTimeout(r, 8000)); // wait create

    console.log('STEP 3 → Fund channel');
    await this.resizeChannel(this.lastChannelId!, fundAmount, this.account);

    await new Promise(r => setTimeout(r, 3000));

    console.log('STEP 4 → Pay recipient');
    await this.pay(payAmount, recipient);

    await new Promise(r => setTimeout(r, 2000));

    console.log('--- Sender ledger AFTER transfer ---');
    await this.getBalance();

    console.log('--- Recipient ledger AFTER transfer ---');
    await this.getRecipientBalance(recipient);

    console.log('STEP 5 → Close channel (settlement)');
    await this.closeChannel(this.lastChannelId!);

    console.log('--- Final ledger ---');
    await this.getBalance();
    await this.getRecipientBalance(recipient);

    const bal = await this.getCustodyBalance(token);
    console.log('Custody after:', bal);

    console.log('=== Flow Complete ===\n');
  }

}

/* ======================================================
   INIT
====================================================== */

export async function initYellow() {
  const { walletClient, account, ensName, ensAvatar } = await setupWalletClient();

  const ws = connectClearnode('wss://clearnet-sandbox.yellow.com/ws');

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.ALCHEMY_RPC_URL),
  });

  const client = new YellowClient(ws, account, walletClient, publicClient, ensName, ensAvatar);

  await client.authenticate();
  await client.getBalance();

  return client;
}
