import {
  NitroliteClient,
  WalletStateSigner,
} from '@erc7824/nitrolite';

import {
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';

import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import WebSocket from 'ws';
import 'dotenv/config';

async function main() {
  console.log("🚀 Starting Yellow setup...\n");

  // ==============================
  // Setup Account
  // ==============================
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);

  console.log("👛 Wallet address:", account.address);

  // ==============================
  // Setup Viem Clients
  // ==============================
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.ALCHEMY_RPC_URL),
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(process.env.ALCHEMY_RPC_URL),
    account,
  });

  console.log("✅ Viem clients ready");

  // ==============================
  // Check ETH balance
  // ==============================
  const balance = await publicClient.getBalance({
    address: account.address,
  });

  console.log("💰 ETH Balance:", balance.toString());

  if (balance === 0n) {
    console.log("❌ No ETH. Get Sepolia faucet first.");
  }

  // ==============================
  // Initialize Yellow Client
  // ==============================
  const client = new NitroliteClient({
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

  console.log("✅ Nitrolite client created");

  // ==============================
  // Connect to Yellow Clearnode
  // ==============================
  const ws = new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

  ws.on('open', () => {
    console.log("🟡 Connected to Yellow Clearnode");
  });

  ws.on('error', (err) => {
    console.log("❌ WS Error:", err);
  });

  ws.on('close', () => {
    console.log("🔌 WS closed");
  });

  // ==============================
  // Test channel creation
  // ==============================
  try {
    console.log("\n⏳ Creating channel...");

    const channel = await client.createChannel({
      participants: [account.address],
    });

    console.log("✅ Channel created:", channel.channelId);
  } catch (e) {
    console.log("❌ Channel creation failed:", e);
  }
}

main();
