# FluxPay - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Set up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-schema.sql`
4. Go to Settings → API to get your:
   - Project URL
   - Anon/Public key

### Step 2: Configure Environment (1 minute)

Create `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
```

### Step 3: Get Test Tokens (2 minutes)

1. **Get Sepolia ETH**: Use [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. **Get Yellow Test Tokens**:
```bash
curl -XPOST https://clearnet-sandbox.yellow.com/faucet/requestTokens \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"YOUR_WALLET_ADDRESS"}'
```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📋 Testing the Full Flow

### Test as Manager:

1. **Connect wallet** and select "Manager"
2. **Create workspace** (e.g., "Engineering Team")
3. **Open payment channel**:
   - Click "Open Payment Channel"
   - Approve MetaMask transactions
   - Wait ~8 seconds for channel creation
4. **Add employee**:
   - Name: "Alice"
   - Address: `0xa4200162309D1F65CC1eadDe023ba42Ccfb6eD16` (or any address)
5. **Create task**:
   - Title: "Fix login bug"
   - Description: "Update authentication flow"
   - Reward: 10 tokens
   - Assign to: Alice
6. **Wait for employee to complete task** (or test with second wallet)
7. **Approve & pay** when task is marked complete
8. **Close channel** at end of day for settlement

### Test as Employee:

1. **Connect wallet** (use different address than manager)
2. **Select "Employee"**
3. **View assigned tasks**
4. **Mark task as completed**
5. **Check balance** after manager approves

---

## 🔍 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FluxPay System                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Manager                          Employee               │
│  ┌──────────┐                    ┌──────────┐           │
│  │ Deposit  │                    │   View   │           │
│  │ Tokens   │                    │  Tasks   │           │
│  └────┬─────┘                    └────┬─────┘           │
│       │                                │                 │
│  ┌────▼─────┐                    ┌────▼─────┐           │
│  │  Open    │                    │  Mark    │           │
│  │ Channel  │                    │ Complete │           │
│  └────┬─────┘                    └────┬─────┘           │
│       │                                │                 │
│  ┌────▼─────┐                    ┌────▼─────┐           │
│  │ Approve  │────Off-chain───────▶  Receive │           │
│  │  & Pay   │    Payment          │ Payment │           │
│  └────┬─────┘                    └──────────┘           │
│       │                                                  │
│  ┌────▼─────┐                                           │
│  │  Close   │                                           │
│  │ Channel  │                                           │
│  │(Settle)  │                                           │
│  └──────────┘                                           │
│                                                           │
├─────────────────────────────────────────────────────────┤
│              Yellow Network (Off-chain)                  │
│              Supabase (Task Database)                    │
│              Ethereum Sepolia (Settlement)               │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Key Concepts

### Off-Chain Payments
- Payments happen instantly on Yellow Network
- No gas fees for individual payments
- Balances update in real-time

### Daily Settlement
- Manager closes channel once per day
- All off-chain balances settle on-chain
- Employees receive funds in their wallets

### Performance-Based Pay
- Employees paid per completed task
- Different tasks can have different rewards
- Bonuses for high performers

---

## 🎯 Use Cases

1. **Freelance Teams**: Pay contractors per deliverable
2. **Remote Workers**: Track and reward completed tasks
3. **Gig Economy**: Instant micropayments for small tasks
4. **Bounty Programs**: Reward bug fixes and features
5. **Incentive Programs**: Bonus payments for achievements

---

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Open an issue on GitHub
- Check browser console for error messages
- Verify all environment variables are set correctly

---

## 🎉 You're Ready!

Your FluxPay system is now set up and ready to use. Start creating workspaces and assigning tasks!
