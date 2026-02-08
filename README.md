# FluxPay - Performance-Based Payroll on Yellow Network

FluxPay is a decentralized payroll system built on Yellow Network that enables performance-based compensation. Managers can create workspaces, assign tasks with specific rewards, and employees get paid instantly off-chain based on completed work.

## 🌟 Features

### For Managers
- **Create Workspaces**: Organize teams and projects
- **Add Employees**: Add team members by wallet address
- **Assign Tasks**: Create tasks with specific reward amounts
- **Approve & Pay**: Review completed work and release instant payments
- **Daily Settlement**: Close channels once per day for on-chain settlement

### For Employees
- **View Tasks**: See all assigned tasks in one place
- **Mark Complete**: Submit completed work for approval
- **Track Earnings**: Monitor off-chain balance in real-time
- **No Deposits**: Receive payments without any upfront deposits
- **Instant Payments**: Get paid immediately upon approval

## 🏗️ Architecture

### Yellow Network Integration
- **Manager**: Opens ONE payment channel and deposits liquidity
- **Employees**: Receive off-chain payments only (no deposits required)
- **Settlement**: On-chain settlement happens once per day
- **Payments**: Use `createTransferMessage` for off-chain transfers

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Custom CSS
- **Blockchain**: Yellow Network (Sepolia testnet), Viem, Wagmi
- **Database**: Supabase (PostgreSQL)
- **State Channel**: Nitrolite (@erc7824/nitrolite)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Supabase account
- Alchemy RPC URL (Sepolia)

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/HariPad2005/FluxPay.git
cd FluxPay
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in the SQL Editor
   - Get your project URL and anon key

4. **Configure environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ALCHEMY_RPC_URL=your_alchemy_sepolia_rpc_url
```

5. **Get test tokens**
   - Request Sepolia ETH from a faucet
   - Request Yellow test tokens:
```bash
curl -XPOST https://clearnet-sandbox.yellow.com/faucet/requestTokens \
  -H "Content-Type: application/json" \
  -d '{"userAddress":"YOUR_WALLET_ADDRESS"}'
```

6. **Run the development server**
```bash
npm run dev
```

7. **Open the app**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### As a Manager

1. **Connect Wallet**: Connect your MetaMask wallet
2. **Select Role**: Click "Enter as Manager" on the home page
3. **Create Workspace**: Create a new workspace for your team
4. **Open Payment Channel**: 
   - Click "Open Payment Channel"
   - Approve deposit transaction
   - Wait for channel creation (~8 seconds)
5. **Add Employees**: Add team members using their wallet addresses
6. **Create Tasks**: 
   - Assign tasks to employees
   - Set reward amounts for each task
7. **Approve & Pay**:
   - When employees mark tasks complete, review them
   - Click "Approve & Pay" to send instant off-chain payment
8. **Daily Settlement**:
   - At end of day, click "Close Channel & Settle"
   - This finalizes all payments on-chain

### As an Employee

1. **Connect Wallet**: Connect your MetaMask wallet
2. **Select Role**: Click "Enter as Employee" on the home page
3. **View Tasks**: See all tasks assigned to you
4. **Complete Work**: Do the assigned work
5. **Mark Complete**: Click "Mark as Completed" when done
6. **Get Paid**: Manager approves and you receive instant payment
7. **Check Balance**: View your off-chain balance anytime

## 📊 Database Schema

### Tables

**workspaces**
- `id`: UUID (primary key)
- `name`: TEXT
- `manager_address`: TEXT
- `channel_id`: TEXT (nullable)
- `created_at`: TIMESTAMP

**employees**
- `id`: UUID (primary key)
- `workspace_id`: UUID (foreign key)
- `wallet_address`: TEXT
- `name`: TEXT
- `added_at`: TIMESTAMP

**tasks**
- `id`: UUID (primary key)
- `workspace_id`: UUID (foreign key)
- `employee_address`: TEXT
- `title`: TEXT
- `description`: TEXT
- `reward_amount`: NUMERIC
- `status`: TEXT (pending, completed, approved, paid)
- `created_at`: TIMESTAMP
- `completed_at`: TIMESTAMP (nullable)
- `approved_at`: TIMESTAMP (nullable)
- `paid_at`: TIMESTAMP (nullable)

## 🔧 Key Components

### Yellow Client (`app/lib/yellow/client.ts`)
- Manages Yellow Network connection
- Handles deposits, channels, and payments
- Wraps Nitrolite SDK

### Manager Dashboard (`app/manager/page.tsx`)
- Workspace management
- Employee management
- Task creation and approval
- Payment processing
- Channel management

### Employee Dashboard (`app/employee/page.tsx`)
- Task viewing
- Task completion
- Balance tracking
- No channel management required

### Supabase Client (`app/lib/supabase/client.ts`)
- Database connection
- TypeScript types for tables

## 🎨 UI Features

- **Glassmorphism Design**: Modern frosted glass effects
- **Gradient Animations**: Smooth color transitions
- **Floating Particles**: Dynamic background elements
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Live balance and task updates
- **Status Notifications**: Toast-style status messages

## 🔐 Security Considerations

- **Row Level Security**: Enable RLS policies in Supabase for production
- **Wallet Verification**: Verify wallet ownership before critical operations
- **Input Validation**: Validate all user inputs
- **Rate Limiting**: Implement rate limiting for API calls
- **Environment Variables**: Never commit `.env.local` to version control

## 🐛 Troubleshooting

### "Unknown at rule @theme" error
- Make sure Google Fonts import comes before Tailwind import in `globals.css`

### Channel creation fails
- Ensure you have enough Sepolia ETH for gas
- Ensure you have test tokens in custody contract
- Check Alchemy RPC URL is correct

### Supabase connection fails
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure RLS policies allow operations

### Payments not showing
- Refresh the page
- Check browser console for errors
- Verify channel is open
- Check employee wallet address is correct

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- Yellow Network for the state channel infrastructure
- Nitrolite SDK for the channel management
- Supabase for the database solution
- Next.js team for the amazing framework
