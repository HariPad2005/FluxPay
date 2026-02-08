'use client';

import { useYellow } from '../lib/hooks/useYellow';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { Briefcase, Users, Clock, DollarSign, Plus, Search, X, Check, Zap, TrendingUp, UserPlus, Sparkles, Activity, Copy, Download, Filter, Terminal, CheckCircle, Loader2, AlertCircle, Wallet, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Workspace {
    id: string;
    name: string;
    manager_address: string;
    channel_id: string | null;
    created_at: string;
}

interface Employee {
    id: string;
    wallet_address: string;
    name: string;
    created_at: string;
}

interface WorkspaceEmployee {
    employee: Employee;
    totalEarned: number;
    taskCount: number;
}

interface Task {
    id: string;
    workspace_id: string;
    employee_address: string;
    title: string;
    description: string;
    reward_amount: number;
    status: 'pending' | 'completed' | 'approved' | 'paid';
    created_at: string;
    completed_at: string | null;
    approved_at: string | null;
    paid_at: string | null;
}

interface LogEntry {
    id: string;
    step: number;
    message: string;
    status: 'pending' | 'running' | 'success' | 'error';
    timestamp: Date;
}

export default function ManagerDashboard() {
    const yellow = useYellow();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [workspaceEmployees, setWorkspaceEmployees] = useState<WorkspaceEmployee[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const [workspaceSearch, setWorkspaceSearch] = useState('');
    const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'completed' | 'approved' | 'paid'>('all');

    const [workspaceName, setWorkspaceName] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Employee[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
    const [addingEmployee, setAddingEmployee] = useState<string | null>(null);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskReward, setTaskReward] = useState('');
    const [taskEmployee, setTaskEmployee] = useState('');

    const [channelStatus, setChannelStatus] = useState<'none' | 'opening' | 'open'>('none');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');

    const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [sessionActive, setSessionActive] = useState(false);
    const [autoSettlementTriggered, setAutoSettlementTriggered] = useState(false);

    const [channelLogs, setChannelLogs] = useState<LogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    // Balance state
    const [walletBalance, setWalletBalance] = useState<string>('0.00');
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const addLog = (step: number, message: string, status: LogEntry['status'] = 'running') => {
        const entry: LogEntry = {
            id: `${Date.now()}-${step}`,
            step,
            message,
            status,
            timestamp: new Date(),
        };
        setChannelLogs(prev => [...prev, entry]);
    };

    const updateLogStatus = (step: number, status: LogEntry['status']) => {
        setChannelLogs(prev => prev.map(log =>
            log.step === step ? { ...log, status } : log
        ));
    };

    const clearLogs = () => setChannelLogs([]);

    // Fetch balance
    const fetchBalance = async () => {
        if (!yellow) return;
        setIsLoadingBalance(true);
        try {
            const balance = await yellow.getBalance();
            setWalletBalance(balance);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    useEffect(() => {
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(21, 59, 0, 0);
        if (now > endTime) endTime.setDate(endTime.getDate() + 1);
        setSessionEndTime(endTime);
    }, []);

    useEffect(() => {
        if (!sessionEndTime) return;
        const interval = setInterval(() => {
            const now = new Date();
            const diff = sessionEndTime.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeRemaining('Ended');
                setSessionActive(false);
                clearInterval(interval);
                // Trigger automatic settlement when session ends
                if (!autoSettlementTriggered && selectedWorkspace?.channel_id && yellow) {
                    triggerAutoSettlement();
                }
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            setSessionActive(true);
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionEndTime, autoSettlementTriggered, selectedWorkspace?.channel_id, yellow]);

    useEffect(() => {
        if (yellow?.account) {
            loadWorkspaces();
            fetchBalance();
        }
    }, [yellow?.account]);

    useEffect(() => {
        if (selectedWorkspace) {
            loadWorkspaceEmployees();
            loadTasks();
            if (selectedWorkspace.channel_id) setChannelStatus('open');
            else setChannelStatus('none');
        }
    }, [selectedWorkspace]);

    const loadWorkspaces = async () => {
        const { data } = await supabase
            .from('workspaces')
            .select('*')
            .eq('manager_address', yellow?.account)
            .order('created_at', { ascending: false });
        if (data) setWorkspaces(data);
    };

    const loadWorkspaceEmployees = async () => {
        if (!selectedWorkspace) return;
        const { data: workspaceTasks } = await supabase
            .from('tasks')
            .select('*')
            .eq('workspace_id', selectedWorkspace.id);
        if (!workspaceTasks) return;
        const employeeAddresses = [...new Set(workspaceTasks.map(t => t.employee_address))];
        if (employeeAddresses.length === 0) {
            setWorkspaceEmployees([]);
            return;
        }
        const { data: employees } = await supabase
            .from('employees')
            .select('*')
            .in('wallet_address', employeeAddresses);
        if (!employees) return;
        const employeesWithEarnings: WorkspaceEmployee[] = employees.map(emp => {
            const empTasks = workspaceTasks.filter(t => t.employee_address === emp.wallet_address);
            const totalEarned = empTasks
                .filter(t => t.status === 'paid')
                .reduce((sum, t) => sum + t.reward_amount, 0);
            return { employee: emp, totalEarned, taskCount: empTasks.length };
        });
        setWorkspaceEmployees(employeesWithEarnings);
    };

    const loadTasks = async () => {
        if (!selectedWorkspace) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('workspace_id', selectedWorkspace.id)
            .order('created_at', { ascending: false });
        if (data) setTasks(data);
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadWorkspaces(),
                loadWorkspaceEmployees(),
                loadTasks(),
                fetchBalance(),
            ]);
            showStatus('✅ Data refreshed');
        } catch (error) {
            showStatus('❌ Refresh failed');
        } finally {
            setIsRefreshing(false);
        }
    };

    const createWorkspace = async () => {
        if (!workspaceName || !yellow?.account) return;
        const { data } = await supabase
            .from('workspaces')
            .insert({ name: workspaceName, manager_address: yellow.account })
            .select()
            .single();
        if (data) {
            setWorkspaces([data, ...workspaces]);
            setWorkspaceName('');
            setShowCreateWorkspace(false);
            setSelectedWorkspace(data);
            showStatus('✨ Workspace created');
        }
    };

    const searchEmployees = async () => {
        if (!employeeSearch.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const searchTerm = employeeSearch.trim().toLowerCase();
            const { data } = await supabase
                .from('employees')
                .select('*')
                .or(`wallet_address.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
                .limit(10);
            if (data) {
                const filteredData = data.filter(emp =>
                    !workspaceEmployees.some(we => we.employee.wallet_address.toLowerCase() === emp.wallet_address.toLowerCase())
                );
                setSearchResults(filteredData);
                setSelectedSearchIndex(-1);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!employeeSearch.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => { searchEmployees(); }, 300);
        return () => clearTimeout(timer);
    }, [employeeSearch]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSearchIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSearchIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
            e.preventDefault();
            addEmployeeToWorkspace(searchResults[selectedSearchIndex]);
        } else if (e.key === 'Escape') {
            setShowAddEmployee(false);
            setEmployeeSearch('');
            setSearchResults([]);
        }
    };

    const addEmployeeToWorkspace = async (employee: Employee) => {
        if (!selectedWorkspace) return;
        const existing = workspaceEmployees.find(we => we.employee.wallet_address.toLowerCase() === employee.wallet_address.toLowerCase());
        if (existing) {
            showStatus('⚠️ Already in workspace');
            return;
        }
        setAddingEmployee(employee.id);
        try {
            const { data } = await supabase
                .from('tasks')
                .insert({
                    workspace_id: selectedWorkspace.id,
                    employee_address: employee.wallet_address.toLowerCase(),
                    title: 'Welcome Task',
                    description: 'Complete your first task',
                    reward_amount: 0,
                    status: 'pending',
                })
                .select()
                .single();
            if (data) {
                showStatus(`✅ Added ${employee.name} to workspace`);
                setSearchResults(prev => prev.filter(e => e.id !== employee.id));
                setEmployeeSearch('');
                setSearchResults([]);
                setShowAddEmployee(false);
                loadWorkspaceEmployees();
                loadTasks();
            }
        } catch (error) {
            showStatus('❌ Failed to add employee');
        } finally {
            setAddingEmployee(null);
        }
    };

    const createTask = async () => {
        if (!selectedWorkspace || !taskTitle || !taskReward || !taskEmployee) return;
        const { data } = await supabase
            .from('tasks')
            .insert({
                workspace_id: selectedWorkspace.id,
                employee_address: taskEmployee.toLowerCase(),
                title: taskTitle,
                description: taskDescription,
                reward_amount: parseFloat(taskReward),
                status: 'pending',
            })
            .select()
            .single();
        if (data) {
            setTasks([data, ...tasks]);
            setTaskTitle('');
            setTaskDescription('');
            setTaskReward('');
            setTaskEmployee('');
            setShowCreateTask(false);
            showStatus('✨ Task created');
            loadWorkspaceEmployees();
        }
    };

    const openChannel = async () => {
        if (!selectedWorkspace || !yellow) return;
        setIsProcessing(true);
        setChannelStatus('opening');
        setShowLogs(true);
        clearLogs();
        try {
            addLog(1, 'Initializing channel creation...', 'running');
            await new Promise(r => setTimeout(r, 500));
            updateLogStatus(1, 'success');
            addLog(2, 'Connecting to Yellow Network WebSocket...', 'running');
            await new Promise(r => setTimeout(r, 800));
            updateLogStatus(2, 'success');
            addLog(3, 'Requesting channel from Clearnode...', 'running');
            await yellow.openChannel('0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb');
            updateLogStatus(3, 'success');
            addLog(4, 'Waiting for on-chain confirmation...', 'running');
            await new Promise(r => setTimeout(r, 8000));
            updateLogStatus(4, 'success');
            if (yellow.lastChannelId) {
                addLog(5, `Channel ID: ${yellow.lastChannelId.slice(0, 16)}...`, 'running');
                await supabase
                    .from('workspaces')
                    .update({ channel_id: yellow.lastChannelId })
                    .eq('id', selectedWorkspace.id);
                setSelectedWorkspace({ ...selectedWorkspace, channel_id: yellow.lastChannelId });
                updateLogStatus(5, 'success');
                addLog(6, 'Channel opened successfully!', 'success');
                setChannelStatus('open');
                showStatus('✅ Channel opened');
                fetchBalance();
            }
        } catch (error: any) {
            addLog(0, `Error: ${error.message || 'Failed to open channel'}`, 'error');
            showStatus('❌ Failed to open channel');
            setChannelStatus('none');
        } finally {
            setIsProcessing(false);
        }
    };

    const approveAndPay = async (task: Task) => {
        if (!yellow || !selectedWorkspace?.channel_id) return;
        setIsProcessing(true);
        setShowLogs(true);
        clearLogs();
        try {
            addLog(1, `Processing payment of ${task.reward_amount} USDC...`, 'running');
            await new Promise(r => setTimeout(r, 500));
            updateLogStatus(1, 'success');
            addLog(2, `Sending to ${task.employee_address.slice(0, 10)}...`, 'running');
            await yellow.pay(task.reward_amount, task.employee_address);
            updateLogStatus(2, 'success');
            addLog(3, 'Updating database...', 'running');
            await supabase
                .from('tasks')
                .update({
                    status: 'paid',
                    approved_at: new Date().toISOString(),
                    paid_at: new Date().toISOString(),
                })
                .eq('id', task.id);
            updateLogStatus(3, 'success');
            addLog(4, 'Payment completed!', 'success');
            loadTasks();
            loadWorkspaceEmployees();
            fetchBalance();
            showStatus('✅ Payment sent');
        } catch (error: any) {
            addLog(0, `Error: ${error.message || 'Payment failed'}`, 'error');
            showStatus('❌ Payment failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const closeChannelAndSettle = async () => {
        if (!yellow || !selectedWorkspace?.channel_id) return;
        setIsProcessing(true);
        setShowLogs(true);
        clearLogs();
        try {
            addLog(1, 'Initiating channel settlement...', 'running');
            await new Promise(r => setTimeout(r, 500));
            updateLogStatus(1, 'success');
            addLog(2, 'Signing close request...', 'running');
            await new Promise(r => setTimeout(r, 800));
            updateLogStatus(2, 'success');
            addLog(3, 'Submitting to blockchain...', 'running');
            await yellow.closeChannel(selectedWorkspace.channel_id);
            updateLogStatus(3, 'success');
            addLog(4, 'Updating workspace...', 'running');
            await supabase
                .from('workspaces')
                .update({ channel_id: null })
                .eq('id', selectedWorkspace.id);
            setSelectedWorkspace({ ...selectedWorkspace, channel_id: null });
            updateLogStatus(4, 'success');
            addLog(5, 'Settlement complete!', 'success');
            setChannelStatus('none');
            fetchBalance();
            showStatus('✅ Settlement complete');
        } catch (error: any) {
            addLog(0, `Error: ${error.message || 'Settlement failed'}`, 'error');
            showStatus('❌ Settlement failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Automatic end-of-session settlement
    const triggerAutoSettlement = async () => {
        if (!yellow || !selectedWorkspace?.channel_id || autoSettlementTriggered) return;

        setAutoSettlementTriggered(true);
        setIsProcessing(true);
        setShowLogs(true);
        clearLogs();

        try {
            addLog(1, '🔔 Session ended - Starting automatic settlement...', 'running');
            await new Promise(r => setTimeout(r, 500));
            updateLogStatus(1, 'success');

            // Get all completed tasks that need payment
            const { data: completedTasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('workspace_id', selectedWorkspace.id)
                .eq('status', 'completed');

            if (completedTasks && completedTasks.length > 0) {
                addLog(2, `Found ${completedTasks.length} tasks to pay...`, 'running');
                await new Promise(r => setTimeout(r, 300));
                updateLogStatus(2, 'success');

                // Pay each completed task
                let paidCount = 0;
                for (const task of completedTasks) {
                    try {
                        addLog(3 + paidCount, `Paying ${task.reward_amount} USDC to ${task.employee_address.slice(0, 10)}...`, 'running');
                        await yellow.pay(task.reward_amount, task.employee_address);

                        await supabase
                            .from('tasks')
                            .update({
                                status: 'paid',
                                approved_at: new Date().toISOString(),
                                paid_at: new Date().toISOString(),
                            })
                            .eq('id', task.id);

                        updateLogStatus(3 + paidCount, 'success');
                        paidCount++;
                    } catch (error: any) {
                        addLog(3 + paidCount, `Failed to pay task: ${task.title}`, 'error');
                        paidCount++;
                    }
                }

                addLog(3 + paidCount, `✅ Paid ${paidCount} of ${completedTasks.length} tasks`, 'success');
            } else {
                addLog(2, 'No pending tasks to pay', 'success');
            }

            // Now settle the channel on-chain
            const stepOffset = (completedTasks?.length || 0) + 4;
            addLog(stepOffset, 'Initiating on-chain settlement...', 'running');
            await new Promise(r => setTimeout(r, 500));
            updateLogStatus(stepOffset, 'success');

            addLog(stepOffset + 1, 'Signing close request...', 'running');
            await new Promise(r => setTimeout(r, 800));
            updateLogStatus(stepOffset + 1, 'success');

            addLog(stepOffset + 2, 'Submitting to blockchain...', 'running');
            await yellow.closeChannel(selectedWorkspace.channel_id);
            updateLogStatus(stepOffset + 2, 'success');

            addLog(stepOffset + 3, 'Updating workspace...', 'running');
            await supabase
                .from('workspaces')
                .update({ channel_id: null })
                .eq('id', selectedWorkspace.id);
            setSelectedWorkspace({ ...selectedWorkspace, channel_id: null });
            updateLogStatus(stepOffset + 3, 'success');

            addLog(stepOffset + 4, '🎉 End-of-day settlement complete!', 'success');
            setChannelStatus('none');
            fetchBalance();
            loadTasks();
            loadWorkspaceEmployees();
            showStatus('✅ Auto-settlement complete');

        } catch (error: any) {
            addLog(0, `Error: ${error.message || 'Auto-settlement failed'}`, 'error');
            showStatus('❌ Auto-settlement failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const showStatus = (msg: string) => {
        setStatus(msg);
        setTimeout(() => setStatus(''), 4000);
    };

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(yellow?.account || '');
            showStatus('✅ Address copied');
        } catch {
            showStatus('❌ Copy failed');
        }
    };

    const exportTasksCSV = () => {
        if (!tasks.length) {
            showStatus('⚠️ No tasks to export');
            return;
        }
        const rows = [['ID', 'Title', 'Description', 'Employee', 'Reward', 'Status', 'Created', 'Completed', 'Paid']];
        tasks.forEach(t => {
            rows.push([
                t.id, t.title, t.description?.replace(/\n/g, ' ') ?? '', t.employee_address,
                String(t.reward_amount), t.status, t.created_at, t.completed_at ?? '', t.paid_at ?? ''
            ]);
        });
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedWorkspace?.name ?? 'tasks'}-export.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('✨ Exported');
    };

    if (!yellow) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#08080c]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.12),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,80,255,0.08),transparent_50%)]" />
                <div className="text-center relative z-10">
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }} />
                        <div className="absolute inset-1.5 rounded-full bg-[#08080c]" />
                        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 animate-pulse" />
                    </div>
                    <p className="text-white font-semibold text-xl">Connecting to Yellow Network</p>
                    <p className="text-white/40 text-base mt-3">Approve the connection in your wallet</p>
                </div>
            </div>
        );
    }

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const paidTasks = tasks.filter(t => t.status === 'paid');
    const totalPaid = paidTasks.reduce((sum, t) => sum + t.reward_amount, 0);
    const displayedWorkspaces = workspaces.filter(ws => !workspaceSearch || ws.name.toLowerCase().includes(workspaceSearch.toLowerCase()));
    const displayedTasks = tasks.filter(t => taskStatusFilter === 'all' || t.status === taskStatusFilter);

    return (
        <div className="h-screen flex flex-col bg-[#08080c] overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,80,255,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,80,255,0.06),transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="relative z-20 border-b border-white/[0.08] bg-[#08080c]/90 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-8 py-5">
                    {/* Left - Logo & Info */}
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-white tracking-tight">FluxPay Manager</h1>
                                <button
                                    onClick={refreshData}
                                    disabled={isRefreshing}
                                    className="p-2 rounded-lg hover:bg-white/[0.08] transition-all disabled:opacity-50"
                                    title="Refresh data"
                                >
                                    <RefreshCw className={cn("w-4 h-4 text-white/50 hover:text-white/80", isRefreshing && "animate-spin")} />
                                </button>
                            </div>
                            <button onClick={copyAddress} className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors group mt-0.5">
                                <span className="font-mono">{yellow.account?.slice(0, 10)}...{yellow.account?.slice(-6)}</span>
                                <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>

                    {/* Center - Stats */}
                    <div className="flex items-center gap-3">
                        {[
                            { label: 'Workspaces', value: workspaces.length, gradient: 'from-violet-500 to-violet-600', icon: Briefcase },
                            { label: 'Team', value: workspaceEmployees.length, gradient: 'from-fuchsia-500 to-fuchsia-600', icon: Users },
                            { label: 'Pending', value: completedTasks.length, gradient: 'from-amber-500 to-orange-500', icon: Clock },
                            { label: 'Paid', value: `$${totalPaid.toFixed(2)}`, gradient: 'from-emerald-500 to-green-500', icon: DollarSign },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all">
                                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", s.gradient)}>
                                    <s.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{s.value}</p>
                                    <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right - Balance & Session */}
                    <div className="flex items-center gap-4">
                        {/* Balance Card */}
                        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-emerald-400">
                                    {isLoadingBalance ? '...' : `$${walletBalance}`}
                                </p>
                                <p className="text-xs text-emerald-400/60 uppercase tracking-wider font-medium">Balance</p>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-white/[0.08]" />

                        {/* Session Timer */}
                        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                            <div className={cn("w-3 h-3 rounded-full", sessionActive ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" : "bg-red-400")} />
                            <div>
                                <span className="text-lg font-semibold text-white">{timeRemaining}</span>
                                <p className="text-xs text-white/40">Session</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Sidebar */}
                <aside className="w-80 border-r border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col">
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
                                <Briefcase className="w-5 h-5 text-violet-400" />
                                Workspaces
                            </h2>
                            <button onClick={() => setShowCreateWorkspace(true)} className="p-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-all hover:scale-105">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                value={workspaceSearch}
                                onChange={(e) => setWorkspaceSearch(e.target.value)}
                                placeholder="Search workspaces..."
                                className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                        {displayedWorkspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => setSelectedWorkspace(ws)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border transition-all",
                                    selectedWorkspace?.id === ws.id
                                        ? "bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10"
                                        : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white text-base truncate">{ws.name}</span>
                                    {ws.channel_id && <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />}
                                </div>
                                <p className="text-sm text-white/35 mt-1">{new Date(ws.created_at).toLocaleDateString()}</p>
                            </button>
                        ))}
                        {displayedWorkspaces.length === 0 && (
                            <div className="text-center py-12">
                                <Briefcase className="w-14 h-14 mx-auto mb-3 text-white/10" />
                                <p className="text-base text-white/35">No workspaces yet</p>
                                <p className="text-sm text-white/25 mt-1">Create one to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Channel Panel */}
                    {selectedWorkspace && (
                        <div className="p-5 border-t border-white/[0.08] bg-white/[0.02]">
                            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-violet-400" />
                                Payment Channel
                            </h3>
                            {channelStatus === 'none' ? (
                                <button
                                    onClick={openChannel}
                                    disabled={isProcessing}
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-xl text-base font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    {isProcessing ? 'Opening...' : 'Open Channel'}
                                </button>
                            ) : channelStatus === 'opening' ? (
                                <div className="py-6 text-center">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                                    <p className="text-base text-white/50">Opening channel...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-sm font-semibold text-emerald-400">Channel Active</span>
                                        </div>
                                        <p className="text-xs text-emerald-400/50 font-mono truncate">{selectedWorkspace.channel_id}</p>
                                    </div>
                                    <button
                                        onClick={closeChannelAndSettle}
                                        disabled={isProcessing}
                                        className="w-full py-3 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/25 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                        Settle & Close
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {selectedWorkspace ? (
                        <>
                            {/* Workspace Header */}
                            <div className="px-8 py-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedWorkspace.name}</h2>
                                    <p className="text-sm text-white/35 font-mono mt-1">{selectedWorkspace.id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-2.5 px-5 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white rounded-xl text-base font-medium transition-all">
                                        <UserPlus className="w-5 h-5 text-fuchsia-400" />
                                        Add Member
                                    </button>
                                    <button
                                        onClick={() => setShowCreateTask(true)}
                                        disabled={workspaceEmployees.length === 0}
                                        className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl text-base font-semibold disabled:opacity-50 transition-all shadow-lg shadow-violet-500/30"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Task
                                    </button>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-hidden p-6">
                                <div className="h-full grid grid-cols-5 gap-6">
                                    {/* Team */}
                                    <div className="col-span-2 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
                                        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                                                <Users className="w-5 h-5 text-fuchsia-400" />
                                                Team Members
                                                <span className="text-sm text-white/35 bg-white/[0.06] px-2.5 py-1 rounded-lg ml-1">{workspaceEmployees.length}</span>
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                            {workspaceEmployees.map(({ employee, totalEarned, taskCount }) => (
                                                <div key={employee.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-fuchsia-500/25">
                                                            {employee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-white text-base truncate">{employee.name}</p>
                                                            <p className="text-sm text-white/35 font-mono truncate mt-0.5">{employee.wallet_address.slice(0, 12)}...</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                                                        <span className="text-sm text-white/45 bg-white/[0.06] px-3 py-1.5 rounded-lg">{taskCount} tasks</span>
                                                        <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-lg">${totalEarned.toFixed(2)} earned</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {workspaceEmployees.length === 0 && (
                                                <div className="text-center py-16">
                                                    <Users className="w-14 h-14 mx-auto mb-3 text-white/10" />
                                                    <p className="text-base text-white/35">No team members</p>
                                                    <p className="text-sm text-white/25 mt-1">Add employees to assign tasks</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tasks */}
                                    <div className="col-span-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
                                        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-white flex items-center gap-2.5">
                                                <Activity className="w-5 h-5 text-violet-400" />
                                                Tasks
                                                <span className="text-sm text-white/35 bg-white/[0.06] px-2.5 py-1 rounded-lg ml-1">{displayedTasks.length}</span>
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                                                    <Filter className="w-4 h-4 text-white/35" />
                                                    <select
                                                        value={taskStatusFilter}
                                                        onChange={(e) => setTaskStatusFilter(e.target.value as typeof taskStatusFilter)}
                                                        className="bg-transparent text-sm text-white/80 focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="all" className="bg-[#08080c]">All Tasks</option>
                                                        <option value="pending" className="bg-[#08080c]">Pending</option>
                                                        <option value="completed" className="bg-[#08080c]">Completed</option>
                                                        <option value="paid" className="bg-[#08080c]">Paid</option>
                                                    </select>
                                                </div>
                                                <button onClick={exportTasksCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white/60 transition-all">
                                                    <Download className="w-4 h-4" />
                                                    Export
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                            {displayedTasks.map((task) => {
                                                const emp = workspaceEmployees.find(we => we.employee.wallet_address === task.employee_address)?.employee;
                                                return (
                                                    <div key={task.id} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all">
                                                        <div className="flex items-start justify-between gap-5">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h4 className="font-semibold text-white text-lg truncate">{task.title}</h4>
                                                                    <span className={cn(
                                                                        "text-xs px-3 py-1 rounded-full font-semibold",
                                                                        task.status === 'paid' ? "bg-emerald-500/20 text-emerald-400" :
                                                                            task.status === 'completed' ? "bg-amber-500/20 text-amber-400" :
                                                                                "bg-white/10 text-white/50"
                                                                    )}>
                                                                        {task.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-white/45 line-clamp-2 mb-3">{task.description}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500/60 to-violet-500/60 flex items-center justify-center text-white text-xs font-semibold">
                                                                        {emp?.name.charAt(0).toUpperCase() || '?'}
                                                                    </div>
                                                                    <span className="text-sm text-white/45">{emp?.name || 'Unknown'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-bold text-emerald-400">${task.reward_amount}</p>
                                                                    <p className="text-xs text-white/35">USDC</p>
                                                                </div>
                                                                {task.status === 'completed' && channelStatus === 'open' && (
                                                                    <button
                                                                        onClick={() => approveAndPay(task)}
                                                                        disabled={isProcessing}
                                                                        className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                                                                    >
                                                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                        Pay Now
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {displayedTasks.length === 0 && (
                                                <div className="text-center py-16">
                                                    <Activity className="w-14 h-14 mx-auto mb-3 text-white/10" />
                                                    <p className="text-base text-white/35">No tasks found</p>
                                                    <p className="text-sm text-white/25 mt-1">Create a task to get started</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                                    <Briefcase className="w-10 h-10 text-white/20" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Select a Workspace</h3>
                                <p className="text-base text-white/45 max-w-sm">Choose a workspace from the sidebar to manage your team and tasks</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Logs */}
            {showLogs && channelLogs.length > 0 && (
                <div className="fixed bottom-6 right-6 w-96 bg-[#0c0c12]/98 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-5 py-4 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Terminal className="w-5 h-5 text-violet-400" />
                            <span className="text-base font-semibold text-white">Operation Log</span>
                        </div>
                        <button onClick={() => setShowLogs(false)} className="text-white/40 hover:text-white transition-colors p-1">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                        {channelLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]">
                                {log.status === 'running' && <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0 mt-0.5" />}
                                {log.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                                {log.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                                <p className={cn("text-sm", log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-red-400' : 'text-white/60')}>
                                    {log.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Workspace Modal */}
            {showCreateWorkspace && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#0c0c12] border border-white/[0.1] rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Create Workspace</h3>
                            <button onClick={() => setShowCreateWorkspace(false)} className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="Workspace name"
                            className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-base placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-all mb-5"
                            onKeyPress={(e) => e.key === 'Enter' && createWorkspace()}
                            autoFocus
                        />
                        <button onClick={createWorkspace} className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-violet-500/30">
                            Create Workspace
                        </button>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddEmployee && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddEmployee(false); setSearchResults([]); setEmployeeSearch(''); } }}>
                    <div className="bg-[#0c0c12] border border-white/[0.1] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Add Team Member</h3>
                                <p className="text-sm text-white/45 mt-1">Search employees to add</p>
                            </div>
                            <button onClick={() => { setShowAddEmployee(false); setSearchResults([]); setEmployeeSearch(''); }} className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative mb-5">
                            <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search by name or address..."
                                className="w-full pl-11 pr-11 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
                                autoFocus
                            />
                            {isSearching && <Loader2 className="w-4 h-4 text-violet-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
                                {searchResults.map((emp, index) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => addEmployeeToWorkspace(emp)}
                                        disabled={addingEmployee === emp.id}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                            selectedSearchIndex === index ? "bg-fuchsia-500/15 border-fuchsia-500/35" : "bg-white/[0.02] border-transparent hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-fuchsia-500/25">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white text-base">{emp.name}</p>
                                            <p className="text-sm text-white/45 font-mono truncate">{emp.wallet_address.slice(0, 16)}...{emp.wallet_address.slice(-8)}</p>
                                        </div>
                                        {addingEmployee === emp.id ? <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin" /> : <Plus className="w-5 h-5 text-fuchsia-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!employeeSearch && (
                            <div className="text-center py-12 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                                <Search className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-base text-white/35">Search for employees</p>
                            </div>
                        )}
                        {employeeSearch && !isSearching && searchResults.length === 0 && (
                            <div className="text-center py-12 border border-white/[0.06] rounded-xl bg-white/[0.02]">
                                <Users className="w-12 h-12 mx-auto mb-3 text-white/10" />
                                <p className="text-base text-white/35">No employees found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateTask && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#0c0c12] border border-white/[0.1] rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Create Task</h3>
                            <button onClick={() => setShowCreateTask(false)} className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-base placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-all" autoFocus />
                            <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Description (optional)" className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-base placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-all h-28 resize-none" />
                            <input type="number" value={taskReward} onChange={(e) => setTaskReward(e.target.value)} placeholder="Reward amount (USDC)" className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-base placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-all" />
                            <select value={taskEmployee} onChange={(e) => setTaskEmployee(e.target.value)} className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white text-base focus:outline-none focus:border-violet-500/50 transition-all">
                                <option value="">Select team member</option>
                                {workspaceEmployees.map(({ employee }) => (
                                    <option key={employee.id} value={employee.wallet_address}>{employee.name}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={createTask} disabled={!taskTitle || !taskReward || !taskEmployee} className="w-full py-4 mt-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl font-semibold text-base disabled:opacity-50 transition-all shadow-lg shadow-violet-500/30">
                            Create Task
                        </button>
                    </div>
                </div>
            )}

            {/* Toast */}
            {status && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0c0c12]/98 backdrop-blur-2xl border border-white/[0.1] px-6 py-4 rounded-xl shadow-2xl z-50 animate-slide-up">
                    <p className="text-base font-semibold text-white">{status}</p>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-up { animation: slide-up 0.25s ease-out; }
            `}</style>
        </div>
    );
}
