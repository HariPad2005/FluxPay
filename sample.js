// import {
//   NitroliteClient,
//   WalletStateSigner,
// } from '@erc7824/nitrolite';

// import {
//   createPublicClient,
//   createWalletClient,
//   http,
// } from 'viem';

// import { sepolia } from 'viem/chains';
// import { privateKeyToAccount } from 'viem/accounts';
// import WebSocket from 'ws';
// import 'dotenv/config';

// async function main() {
//   console.log("🚀 Starting Yellow setup...\n");

//   // ==============================
//   // Setup Account
//   // ==============================
//   const account = privateKeyToAccount(process.env.PRIVATE_KEY);

//   console.log("👛 Wallet address:", account.address);

//   // ==============================
//   // Setup Viem Clients
//   // ==============================
//   const publicClient = createPublicClient({
//     chain: sepolia,
//     transport: http(process.env.ALCHEMY_RPC_URL),
//   });

//   const walletClient = createWalletClient({
//     chain: sepolia,
//     transport: http(process.env.ALCHEMY_RPC_URL),
//     account,
//   });

//   console.log("✅ Viem clients ready");

//   // ==============================
//   // Check ETH balance
//   // ==============================
//   const balance = await publicClient.getBalance({
//     address: account.address,
//   });

//   console.log("💰 ETH Balance:", balance.toString());

//   if (balance === 0n) {
//     console.log("❌ No ETH. Get Sepolia faucet first.");
//   }

//   // ==============================
//   // Initialize Yellow Client
//   // ==============================
//   const client = new NitroliteClient({
//     publicClient,
//     walletClient,
//     stateSigner: new WalletStateSigner(walletClient),
//     addresses: {
//       custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
//       adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
//     },
//     chainId: sepolia.id,
//     challengeDuration: 3600n,
//   });

//   console.log("✅ Nitrolite client created");

//   // ==============================
//   // Connect to Yellow Clearnode
//   // ==============================
//   const ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

//   ws.on('open', () => {
//     console.log("🟡 Connected to Yellow Clearnode");
//   });

//   ws.on('error', (err) => {
//     console.log("❌ WS Error:", err);
//   });

//   ws.on('close', () => {
//     console.log("🔌 WS closed");
//   });

//   // ==============================
//   // Test channel creation
//   // ==============================
//   try {
//     console.log("\n⏳ Creating channel...");

//     const channel = await client.createChannel({
//       participants: [account.address],
//     });

//     console.log("✅ Channel created:", channel.channelId);
//   } catch (e) {
//     console.log("❌ Channel creation failed:", e);
//   }
// }

// main();

import { createAppSessionMessage, parseAnyRPCResponse } from '@erc7824/nitrolite';

class SimplePaymentApp {
  constructor() {
    this.ws = null;
    this.messageSigner = null;
    this.userAddress = null;
    this.sessionId = null;
  }

  async init() {
    // Step 1: Set up wallet
    const { userAddress, messageSigner } = await this.setupWallet();
    this.userAddress = userAddress;
    this.messageSigner = messageSigner;
    
    // Step 2: Connect to ClearNode (sandbox for testing)
    this.ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');
    
    this.ws.onopen = () => {
      console.log('🟢 Connected to Yellow Network!');
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(parseAnyRPCResponse(event.data));
    };
    
    return userAddress;
  }

  async setupWallet() {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    const userAddress = accounts[0];
    const messageSigner = async (message) => {
      return await window.ethereum.request({
        method: 'personal_sign',
        params: [message, userAddress]
      });
    };

    return { userAddress, messageSigner };
  }

  async createSession(partnerAddress) {
    const appDefinition = {
      protocol: 'payment-app-v1',
      participants: [this.userAddress, partnerAddress],
      weights: [50, 50],
      quorum: 100,
      challenge: 0,
      nonce: Date.now()
    };

    const allocations = [
      { participant: this.userAddress, asset: 'usdc', amount: '800000' },
      { participant: partnerAddress, asset: 'usdc', amount: '200000' }
    ];

    const sessionMessage = await createAppSessionMessage(
      this.messageSigner,
      [{ definition: appDefinition, allocations }]
    );

    this.ws.send(sessionMessage);
    console.log('✅ Payment session created!');
  }

  async sendPayment(amount, recipient) {
    const paymentData = {
      type: 'payment',
      amount: amount.toString(),
      recipient,
      timestamp: Date.now()
    };

    const signature = await this.messageSigner(JSON.stringify(paymentData));
    
    this.ws.send(JSON.stringify({
      ...paymentData,
      signature,
      sender: this.userAddress
    }));
    
    console.log(`💸 Sent ${amount} instantly!`);
  }

  handleMessage(message) {
    switch (message.type) {
      case 'session_created':
        this.sessionId = message.sessionId;
        console.log('✅ Session ready:', this.sessionId);
        break;
      case 'payment':
        console.log('💰 Payment received:', message.amount);
        break;
    }
  }
}

// Usage
const app = new SimplePaymentApp();
await app.init();
await app.createSession('0x941845F7425141d19bE9db618C525e333C11b1c2');
await app.sendPayment('100000', '0x941845F7425141d19bE9db618C525e333C11b1c2'); // Send 0.1 USDC
