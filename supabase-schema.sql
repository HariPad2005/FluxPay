-- FluxPay Schema - Simplified (No workspace_id in employees)
-- Run this in your Supabase SQL Editor

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP VIEW IF EXISTS employee_directory CASCADE;

-- Workspaces table (for manager organization only)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  manager_address TEXT NOT NULL,
  channel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (NO workspace_id - employees are global)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (links workspace to employee)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_address TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX idx_workspaces_manager ON workspaces(manager_address);
CREATE INDEX idx_employees_wallet ON employees(wallet_address);
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_employee ON tasks(employee_address);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_workspace_status ON tasks(workspace_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for development)
CREATE POLICY "Allow all on workspaces" ON workspaces FOR ALL USING (true);
CREATE POLICY "Allow all on employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true);
