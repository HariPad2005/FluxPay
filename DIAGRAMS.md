# FluxPay System Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FluxPay System                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                           ┌──────────────────┐
│  Manager Wallet  │                           │ Employee Wallet  │
│                  │                           │                  │
│  - Deposits      │                           │  - No deposits   │
│  - Opens channel │                           │  - Receives pay  │
│  - Pays employees│                           │  - Checks balance│
│  - Closes channel│                           │                  │
└────────┬─────────┘                           └────────┬─────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Application                           │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ Manager Dashboard│              │Employee Dashboard│         │
│  │                  │              │                  │         │
│  │ - Workspaces     │              │ - View tasks     │         │
│  │ - Employees      │              │ - Mark complete  │         │
│  │ - Tasks          │              │ - Check balance  │         │
│  │ - Payments       │              │ - View earnings  │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                   │
│           └────────────┬────────────────────┘                   │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌──────────┐ ┌──────────────────┐
│   Supabase     │ │  Yellow   │ │   Ethereum       │
│   (Database)   │ │  Network  │ │   (Sepolia)      │
│                │ │           │ │                  │
│ - Workspaces   │ │ - Channels│ │ - Custody        │
│ - Employees    │ │ - Payments│ │ - Adjudicator    │
│ - Tasks        │ │ - Balances│ │ - Settlement     │
└────────────────┘ └──────────┘ └──────────────────┘
```

## 💰 Payment Flow Diagram

```
MANAGER DEPOSITS & OPENS CHANNEL
─────────────────────────────────

Manager Wallet (1000 tokens)
        │
        │ 1. Approve ERC20
        ▼
Custody Contract
        │
        │ 2. Deposit
        ▼
Custody Balance (1000 tokens)
        │
        │ 3. Open Channel
        ▼
Yellow Network Channel (OPEN)
        │
        │ Channel ID: 0xabc...
        └─────────────────────────────┐
                                      │
                                      ▼
                              Supabase Workspace
                              (channel_id: 0xabc...)


OFF-CHAIN PAYMENT FLOW
──────────────────────

Manager Dashboard
        │
        │ 1. Approve Task
        ▼
Yellow Network
        │
        │ 2. createTransferMessage
        │    (amount: 10 tokens)
        │    (to: employee_address)
        ▼
Employee Ledger Balance
        │
        │ Balance: 0 → 10 tokens
        ▼
Employee Dashboard
        │
        │ 3. getBalance()
        ▼
Display: "10 ytest.usd"


DAILY SETTLEMENT FLOW
─────────────────────

Manager Dashboard
        │
        │ 1. Close Channel
        ▼
Yellow Network
        │
        │ 2. Sign final state
        ▼
Ethereum Sepolia
        │
        │ 3. closeChannel() tx
        ▼
Custody Contract
        │
        │ 4. Distribute funds
        ├────────────┬────────────┐
        ▼            ▼            ▼
   Manager      Employee 1   Employee 2
  (990 tokens)  (10 tokens)  (0 tokens)
```

## 🔄 Task Lifecycle

```
TASK CREATION
─────────────
Manager Creates Task
        │
        ├─ Title: "Fix login bug"
        ├─ Description: "Update auth flow"
        ├─ Reward: 10 tokens
        └─ Assign to: Employee A
        │
        ▼
Supabase: tasks table
        │
        └─ status: "pending"


TASK COMPLETION
───────────────
Employee Dashboard
        │
        │ View Task
        ▼
Employee Completes Work
        │
        │ Click "Mark as Completed"
        ▼
Supabase: tasks table
        │
        ├─ status: "pending" → "completed"
        └─ completed_at: timestamp


TASK APPROVAL & PAYMENT
───────────────────────
Manager Dashboard
        │
        │ Review Completed Task
        ▼
Manager Clicks "Approve & Pay"
        │
        ├─ 1. Send off-chain payment
        │      (Yellow Network)
        │
        └─ 2. Update task status
               (Supabase)
        │
        ▼
Supabase: tasks table
        │
        ├─ status: "completed" → "paid"
        ├─ approved_at: timestamp
        └─ paid_at: timestamp
        │
        ▼
Employee Receives Payment
        │
        └─ Balance updated instantly
```

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER ACTIONS                          │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────┐                  ┌───────────────┐
│    Manager    │                  │   Employee    │
│    Actions    │                  │    Actions    │
└───────┬───────┘                  └───────┬───────┘
        │                                  │
        ├─ Create Workspace               ├─ View Tasks
        ├─ Add Employee                   ├─ Mark Complete
        ├─ Create Task                    └─ Check Balance
        ├─ Open Channel                          │
        ├─ Approve & Pay                         │
        └─ Close Channel                         │
        │                                        │
        └────────────┬───────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Supabase   │          │    Yellow    │
│   Database   │          │   Network    │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ - workspaces │          │ - channels   │
│ - employees  │          │ - payments   │
│ - tasks      │          │ - balances   │
└──────────────┘          └──────────────┘
```

## 🔐 Security Model

```
┌─────────────────────────────────────────┐
│         Security Layers                  │
└─────────────────────────────────────────┘

Layer 1: Wallet Authentication
─────────────────────────────
User connects MetaMask
        │
        ├─ Wallet address verified
        └─ Used for all operations

Layer 2: Database Security (Supabase)
──────────────────────────────────────
Row Level Security (RLS)
        │
        ├─ Managers can only modify their workspaces
        ├─ Employees can only view their tasks
        └─ Public read for balances

Layer 3: Smart Contract Security
─────────────────────────────────
Custody Contract
        │
        ├─ Only owner can deposit
        ├─ Channel signatures required
        └─ Adjudicator validates states

Layer 4: Yellow Network Security
─────────────────────────────────
State Channels
        │
        ├─ Cryptographic signatures
        ├─ Session keys for auth
        └─ Challenge period for disputes
```

## 🎯 Component Hierarchy

```
App
│
├─ page.tsx (Landing/Role Selection)
│   │
│   ├─ YellowProvider (useYellow hook)
│   │
│   └─ Role Selection Cards
│       ├─ Manager Card → /manager
│       └─ Employee Card → /employee
│
├─ manager/page.tsx (Manager Dashboard)
│   │
│   ├─ Workspace Section
│   │   ├─ Create Workspace Modal
│   │   └─ Workspace Cards
│   │
│   ├─ Channel Management
│   │   ├─ Open Channel Button
│   │   └─ Close Channel Button
│   │
│   ├─ Employee Section
│   │   ├─ Add Employee Modal
│   │   └─ Employee List
│   │
│   └─ Task Section
│       ├─ Create Task Modal
│       └─ Task Cards
│           └─ Approve & Pay Button
│
└─ employee/page.tsx (Employee Dashboard)
    │
    ├─ Stats Cards
    │   ├─ Off-Chain Balance
    │   ├─ Total Earned
    │   ├─ Pending Tasks
    │   └─ Completed Tasks
    │
    ├─ Pending Tasks Section
    │   └─ Task Cards
    │       └─ Mark Complete Button
    │
    ├─ Awaiting Approval Section
    │   └─ Task Cards
    │
    └─ Paid Tasks Section
        └─ Task Cards
```

## 📱 User Interface Flow

```
LANDING PAGE
────────────
┌─────────────────────────────┐
│        FluxPay              │
│                             │
│  ┌──────────┐ ┌──────────┐ │
│  │ Manager  │ │ Employee │ │
│  │  Card    │ │   Card   │ │
│  └──────────┘ └──────────┘ │
│                             │
│  [Feature Cards Below]      │
└─────────────────────────────┘
         │           │
    ┌────┘           └────┐
    │                     │
    ▼                     ▼
MANAGER DASH         EMPLOYEE DASH
────────────         ─────────────
┌──────────┐         ┌──────────┐
│Workspaces│         │  Stats   │
├──────────┤         ├──────────┤
│ Channel  │         │ Pending  │
├──────────┤         ├──────────┤
│Employees │         │Completed │
├──────────┤         ├──────────┤
│  Tasks   │         │  Paid    │
└──────────┘         └──────────┘
```

This visual documentation should help understand the complete FluxPay system architecture and flows!
