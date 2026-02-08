# FluxPay - Quick Reference Guide

## 🚀 Getting Started

### 1. Database Setup
```bash
# Go to Supabase Dashboard → SQL Editor
# Run the contents of supabase-schema.sql
```

### 2. Environment Variables
```bash
# Copy .env.local.example to .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ALCHEMY_RPC_URL=your_alchemy_rpc_url
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 📊 Database Schema

### Tables

**workspaces**
- `id` - UUID (primary key)
- `name` - Workspace name
- `manager_address` - Manager's wallet
- `channel_id` - Payment channel ID (nullable)
- `created_at` - Timestamp

**employees** (✨ No workspace_id!)
- `id` - UUID (primary key)
- `wallet_address` - Unique wallet address
- `name` - Employee name
- `created_at` - Timestamp

**tasks**
- `id` - UUID (primary key)
- `workspace_id` - Links to workspace
- `employee_address` - Employee's wallet
- `title` - Task title
- `description` - Task description
- `reward_amount` - Payment amount
- `status` - pending | completed | paid
- `created_at` - Timestamp
- `completed_at` - Timestamp (nullable)
- `approved_at` - Timestamp (nullable)
- `paid_at` - Timestamp (nullable)

---

## 👔 Manager Workflow

### Step 1: Create Workspace
```typescript
// Click "New Workspace"
// Enter workspace name
// Workspace is created
```

### Step 2: Open Payment Channel
```typescript
// Select workspace
// Click "Open Channel"
// Deposits 1000 tokens
// Channel opens (takes ~8 seconds)
```

### Step 3: Find Employees
```typescript
// Click "Find Employee"
// Search by wallet address or name
// Employees are globally registered
```

### Step 4: Create Tasks
```typescript
// Click "New Task"
// Enter: title, description, reward, select employee
// Task is assigned to employee
```

### Step 5: Approve & Pay
```typescript
// When employee completes task
// Click "Pay" button
// Instant off-chain payment
// Task status → paid
```

### Step 6: Close Channel
```typescript
// At end of day (after 3:59 PM)
// Click "Settle & Close"
// On-chain settlement
// Channel closes
```

---

## 👤 Employee Workflow

### Step 1: Register
```typescript
// Connect wallet
// Enter name when prompted
// Registration creates global employee record
```

### Step 2: View Tasks
```typescript
// Dashboard shows all assigned tasks
// Organized by: Pending, Awaiting Approval, Paid
```

### Step 3: Complete Tasks
```typescript
// Click "Complete" on pending task
// Only works during session (before 3:59 PM IST)
// Task status → completed
```

### Step 4: Get Paid
```typescript
// Manager approves and pays
// Instant off-chain payment
// Balance updates immediately
```

---

## 🎨 UI Components

### Stats Card
```tsx
<div className="bg-white rounded-lg border border-slate-200 p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">Label</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">Value</p>
    </div>
    <Icon className="w-8 h-8 text-color" />
  </div>
</div>
```

### Button Styles
```tsx
// Primary (Indigo)
className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"

// Success (Green)
className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"

// Warning (Amber)
className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"

// Danger (Red)
className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
```

### Modal
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 w-full max-w-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900">Title</h3>
      <button onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
    </div>
    {/* Content */}
  </div>
</div>
```

---

## 🔍 Common Queries

### Find Employee by Address
```typescript
const { data } = await supabase
  .from('employees')
  .select('*')
  .eq('wallet_address', address.toLowerCase())
  .single();
```

### Find Employee by Name
```typescript
const { data } = await supabase
  .from('employees')
  .select('*')
  .ilike('name', `%${searchTerm}%`);
```

### Get Tasks for Workspace
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('workspace_id', workspaceId)
  .order('created_at', { ascending: false });
```

### Get Tasks for Employee
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('employee_address', employeeAddress.toLowerCase())
  .order('created_at', { ascending: false });
```

### Update Task Status
```typescript
const { error } = await supabase
  .from('tasks')
  .update({ 
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', taskId);
```

---

## ⏰ Session Timer

### Configuration
```typescript
// Session ends at 3:59 PM IST
const endTime = new Date();
endTime.setHours(15, 59, 0, 0);
```

### Behavior
- **Active**: Green indicator, employees can complete tasks
- **Ended**: Red indicator, task completion disabled
- **Manager**: No restrictions, can work anytime
- **Employee**: Can only complete tasks during session

---

## 🎯 Status Flow

### Task Lifecycle
```
pending
  ↓ (Employee marks complete)
completed
  ↓ (Manager approves & pays)
paid
```

### Channel Lifecycle
```
none
  ↓ (Manager opens channel)
opening (8 seconds)
  ↓
open
  ↓ (Manager closes channel)
none
```

---

## 🛠️ Troubleshooting

### Employee Not Found
**Problem**: Manager searches but can't find employee
**Solution**: Employee must register first by connecting wallet

### Task Completion Disabled
**Problem**: Employee can't mark task complete
**Solution**: Check if session is active (before 3:59 PM IST)

### Payment Failed
**Problem**: Manager can't pay employee
**Solution**: 
1. Check if channel is open
2. Verify sufficient balance in channel
3. Ensure task status is 'completed'

### Channel Won't Open
**Problem**: Channel opening fails
**Solution**:
1. Check wallet has sufficient funds
2. Verify Yellow Network connection
3. Wait full 8 seconds for channel to open

---

## 📦 Dependencies

### Core
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety

### Database
- `@supabase/supabase-js` - Database client

### Blockchain
- `viem` - Ethereum library
- `wagmi` - React hooks for Ethereum
- `@erc7824/nitrolite` - State channels

### UI
- `lucide-react` - Icon library
- `tailwindcss` - Styling
- `clsx` - Class utilities
- `tailwind-merge` - Class merging

---

## 🎨 Color Reference

```css
/* Backgrounds */
bg-slate-50     /* Page background */
bg-white        /* Card background */

/* Borders */
border-slate-200  /* Default borders */
border-slate-300  /* Hover borders */

/* Text */
text-slate-900    /* Primary text */
text-slate-600    /* Secondary text */
text-slate-500    /* Tertiary text */

/* Accent Colors */
indigo-600   /* Workspaces, primary actions */
purple-600   /* Employees, team */
green-600    /* Success, payments */
amber-600    /* Warnings, pending */
red-600      /* Errors, danger */
```

---

## 📝 Best Practices

### Database
1. Always use lowercase for wallet addresses
2. Use transactions for multi-step operations
3. Add indexes for frequently queried fields

### UI
1. Show loading states for async operations
2. Display error messages clearly
3. Provide feedback for user actions
4. Use consistent spacing (4px base unit)

### Security
1. Validate all user inputs
2. Use RLS policies in production
3. Never expose private keys
4. Verify wallet ownership

---

## 🚀 Deployment Checklist

- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Enable RLS policies
- [ ] Test all user flows
- [ ] Verify Yellow Network connection
- [ ] Check session timer
- [ ] Test payment flows
- [ ] Verify employee registration
- [ ] Test task completion
- [ ] Validate channel operations

---

## 📞 Support

For issues or questions:
1. Check SCHEMA_CHANGES.md for recent updates
2. Review IMPLEMENTATION.md for architecture
3. See DEPLOYMENT.md for production setup

---

## 🎉 Quick Tips

1. **Employees are global** - No need to add to workspace separately
2. **Tasks link everything** - Tasks connect employees to workspaces
3. **Session timer** - Only affects employee task completion
4. **Instant payments** - Off-chain payments are immediate
5. **Daily settlement** - Close channel at end of day for on-chain settlement
