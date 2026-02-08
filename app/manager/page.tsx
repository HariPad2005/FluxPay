'use client';

import { useYellow } from '../lib/hooks/useYellow';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { Briefcase, Users, Clock, DollarSign, Plus, Search, X, Check, Zap, TrendingUp, UserPlus, Sparkles, Activity, Copy, Download, Filter, Terminal, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
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

    const [channelLogs, setChannelLogs] = useState<LogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);

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

    useEffect(() => {
        const now = new Date();
        const endTime = new Date(now);
        endTime.setHours(15, 59, 0, 0);
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
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            setSessionActive(true);
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionEndTime]);

    useEffect(() => {
        if (yellow?.account) loadWorkspaces();
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
            addLog(1, `Processing payment of ${task.reward_amount} tokens...`, 'running');
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
            showStatus('✅ Settlement complete');
        } catch (error: any) {
            addLog(0, `Error: ${error.message || 'Settlement failed'}`, 'error');
            showStatus('❌ Settlement failed');
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
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,80,255,0.1),transparent_50%)]" />
                <div className="text-center relative z-10">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 50%)' }} />
                        <div className="absolute inset-1 rounded-full bg-[#0a0a0f]" />
                        <div className="absolute inset-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 animate-pulse" />
                    </div>
                    <p className="text-white/90 font-medium text-lg">Connecting to Yellow Network</p>
                    <p className="text-white/40 text-sm mt-2">Approve the connection in your wallet</p>
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
        <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,80,255,0.12),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,80,255,0.08),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,60,200,0.05),transparent_70%)]" />
            </div>

            {/* Header */}
            <header className="relative z-20 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white tracking-tight">FluxPay</h1>
                            <button onClick={copyAddress} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors group">
                                <span className="font-mono">{yellow.account?.slice(0, 8)}...{yellow.account?.slice(-4)}</span>
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2">
                        {[
                            { label: 'Workspaces', value: workspaces.length, gradient: 'from-violet-500 to-violet-600' },
                            { label: 'Team', value: workspaceEmployees.length, gradient: 'from-fuchsia-500 to-fuchsia-600' },
                            { label: 'Pending', value: completedTasks.length, gradient: 'from-amber-500 to-orange-500' },
                            { label: 'Paid', value: totalPaid.toFixed(0), gradient: 'from-emerald-500 to-green-500' },
                        ].map((s, i) => (
                            <div key={i} className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all group">
                                <p className={cn("text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent", s.gradient)}>{s.value}</p>
                                <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{s.label}</p>
                            </div>
                        ))}
                        <div className="ml-2 h-8 w-px bg-white/[0.06]" />
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <div className={cn("w-2 h-2 rounded-full", sessionActive ? "bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" : "bg-red-400")} />
                            <span className="text-xs font-medium text-white/70">{timeRemaining}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Sidebar */}
                <aside className="w-72 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col">
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-medium text-white/80 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-violet-400" />
                                Workspaces
                            </h2>
                            <button onClick={() => setShowCreateWorkspace(true)} className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-all hover:scale-105">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 text-white/20 absolute left-3 top-2.5" />
                            <input
                                value={workspaceSearch}
                                onChange={(e) => setWorkspaceSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
                        {displayedWorkspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => setSelectedWorkspace(ws)}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl border transition-all",
                                    selectedWorkspace?.id === ws.id
                                        ? "bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10"
                                        : "bg-white/[0.02] border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-white/90 text-sm truncate">{ws.name}</span>
                                    {ws.channel_id && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />}
                                </div>
                                <p className="text-[11px] text-white/30 mt-0.5">{new Date(ws.created_at).toLocaleDateString()}</p>
                            </button>
                        ))}
                        {displayedWorkspaces.length === 0 && (
                            <div className="text-center py-8">
                                <Briefcase className="w-10 h-10 mx-auto mb-2 text-white/10" />
                                <p className="text-sm text-white/30">No workspaces</p>
                            </div>
                        )}
                    </div>

                    {/* Channel Panel */}
                    {selectedWorkspace && (
                        <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
                            <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-violet-400" />
                                Payment Channel
                            </h3>
                            {channelStatus === 'none' ? (
                                <button
                                    onClick={openChannel}
                                    disabled={isProcessing}
                                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {isProcessing ? 'Opening...' : 'Open Channel'}
                                </button>
                            ) : channelStatus === 'opening' ? (
                                <div className="py-4 text-center">
                                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                                    <p className="text-xs text-white/50">Opening...</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-xs font-medium text-emerald-400">Active</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-400/50 font-mono truncate">{selectedWorkspace.channel_id}</p>
                                    </div>
                                    <button
                                        onClick={closeChannelAndSettle}
                                        disabled={isProcessing}
                                        className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-xs font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
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
                            <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{selectedWorkspace.name}</h2>
                                    <p className="text-[11px] text-white/30 font-mono">{selectedWorkspace.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowAddEmployee(true)} className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white/80 rounded-xl text-sm font-medium transition-all">
                                        <UserPlus className="w-4 h-4 text-fuchsia-400" />
                                        Add Member
                                    </button>
                                    <button
                                        onClick={() => setShowCreateTask(true)}
                                        disabled={workspaceEmployees.length === 0}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
                                    >
                                        <Plus className="w-4 h-4" />
                                        New Task
                                    </button>
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-hidden p-5">
                                <div className="h-full grid grid-cols-5 gap-5">
                                    {/* Team */}
                                    <div className="col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
                                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-fuchsia-400" />
                                                Team
                                                <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md">{workspaceEmployees.length}</span>
                                            </h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                            {workspaceEmployees.map(({ employee, totalEarned, taskCount }) => (
                                                <div key={employee.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-fuchsia-500/20">
                                                            {employee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-white/90 text-sm truncate">{employee.name}</p>
                                                            <p className="text-[11px] text-white/30 font-mono truncate">{employee.wallet_address.slice(0, 10)}...</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/[0.04]">
                                                        <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-md">{taskCount} tasks</span>
                                                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{totalEarned} earned</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {workspaceEmployees.length === 0 && (
                                                <div className="text-center py-10">
                                                    <Users className="w-10 h-10 mx-auto mb-2 text-white/10" />
                                                    <p className="text-sm text-white/30">No members</p>
                                                    <p className="text-xs text-white/20 mt-1">Add team members to assign tasks</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tasks */}
                                    <div className="col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
                                        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-violet-400" />
                                                Tasks
                                                <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md">{displayedTasks.length}</span>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                                                    <Filter className="w-3.5 h-3.5 text-white/30" />
                                                    <select
                                                        value={taskStatusFilter}
                                                        onChange={(e) => setTaskStatusFilter(e.target.value as typeof taskStatusFilter)}
                                                        className="bg-transparent text-xs text-white/70 focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="all" className="bg-[#0a0a0f]">All</option>
                                                        <option value="pending" className="bg-[#0a0a0f]">Pending</option>
                                                        <option value="completed" className="bg-[#0a0a0f]">Completed</option>
                                                        <option value="paid" className="bg-[#0a0a0f]">Paid</option>
                                                    </select>
                                                </div>
                                                <button onClick={exportTasksCSV} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-lg text-xs text-white/60 transition-all">
                                                    <Download className="w-3.5 h-3.5" />
                                                    Export
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                            {displayedTasks.map((task) => {
                                                const emp = workspaceEmployees.find(we => we.employee.wallet_address === task.employee_address)?.employee;
                                                return (
                                                    <div key={task.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <h4 className="font-medium text-white/90 text-sm truncate">{task.title}</h4>
                                                                    <span className={cn(
                                                                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                                        task.status === 'paid' ? "bg-emerald-500/20 text-emerald-400" :
                                                                            task.status === 'completed' ? "bg-amber-500/20 text-amber-400" :
                                                                                "bg-white/10 text-white/40"
                                                                    )}>
                                                                        {task.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-white/40 line-clamp-1 mb-2">{task.description}</p>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500/50 to-violet-500/50 flex items-center justify-center text-white text-[9px] font-medium">
                                                                        {emp?.name.charAt(0).toUpperCase() || '?'}
                                                                    </div>
                                                                    <span className="text-[11px] text-white/40">{emp?.name || 'Unknown'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-right">
                                                                    <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">{task.reward_amount}</p>
                                                                    <p className="text-[10px] text-white/30">tokens</p>
                                                                </div>
                                                                {task.status === 'completed' && channelStatus === 'open' && (
                                                                    <button
                                                                        onClick={() => approveAndPay(task)}
                                                                        disabled={isProcessing}
                                                                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white rounded-xl text-xs font-medium disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center gap-1.5"
                                                                    >
                                                                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                                        Pay
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {displayedTasks.length === 0 && (
                                                <div className="text-center py-12">
                                                    <Activity className="w-10 h-10 mx-auto mb-2 text-white/10" />
                                                    <p className="text-sm text-white/30">No tasks</p>
                                                    <p className="text-xs text-white/20 mt-1">Create a task to get started</p>
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
                                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                    <Briefcase className="w-8 h-8 text-white/20" />
                                </div>
                                <h3 className="text-lg font-semibold text-white/90 mb-1">Select a Workspace</h3>
                                <p className="text-sm text-white/40 max-w-xs">Choose a workspace from the sidebar to manage team and tasks</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Logs */}
            {showLogs && channelLogs.length > 0 && (
                <div className="fixed bottom-4 right-4 w-80 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-white/80">Log</span>
                        </div>
                        <button onClick={() => setShowLogs(false)} className="text-white/40 hover:text-white/70 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-3 space-y-1.5">
                        {channelLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                                {log.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0 mt-0.5" />}
                                {log.status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                                {log.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs", log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-red-400' : 'text-white/60')}>
                                        {log.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Workspace Modal */}
            {showCreateWorkspace && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#0f0f14] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">New Workspace</h3>
                            <button onClick={() => setShowCreateWorkspace(false)} className="text-white/40 hover:text-white/70 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            placeholder="Workspace name"
                            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && createWorkspace()}
                            autoFocus
                        />
                        <button onClick={createWorkspace} className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25">
                            Create
                        </button>
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddEmployee && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddEmployee(false); setSearchResults([]); setEmployeeSearch(''); } }}>
                    <div className="bg-[#0f0f14] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Add Member</h3>
                                <p className="text-xs text-white/40 mt-0.5">Search employees to add</p>
                            </div>
                            <button onClick={() => { setShowAddEmployee(false); setSearchResults([]); setEmployeeSearch(''); }} className="text-white/40 hover:text-white/70 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 text-white/30 absolute left-4 top-3.5" />
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search by name or address..."
                                className="w-full pl-10 pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
                                autoFocus
                            />
                            {isSearching && <Loader2 className="w-4 h-4 text-violet-400 animate-spin absolute right-4 top-3.5" />}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="space-y-1.5 max-h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                                {searchResults.map((emp, index) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => addEmployeeToWorkspace(emp)}
                                        disabled={addingEmployee === emp.id}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                            selectedSearchIndex === index ? "bg-fuchsia-500/10 border-fuchsia-500/30" : "bg-white/[0.02] border-transparent hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white font-medium text-sm shadow-lg shadow-fuchsia-500/20">
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white/90 text-sm">{emp.name}</p>
                                            <p className="text-[11px] text-white/40 font-mono truncate">{emp.wallet_address.slice(0, 14)}...{emp.wallet_address.slice(-6)}</p>
                                        </div>
                                        {addingEmployee === emp.id ? <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin" /> : <Plus className="w-4 h-4 text-fuchsia-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!employeeSearch && (
                            <div className="text-center py-8 border border-white/[0.04] rounded-xl bg-white/[0.01]">
                                <Search className="w-8 h-8 mx-auto mb-2 text-white/10" />
                                <p className="text-sm text-white/30">Search for employees</p>
                            </div>
                        )}
                        {employeeSearch && !isSearching && searchResults.length === 0 && (
                            <div className="text-center py-8 border border-white/[0.04] rounded-xl bg-white/[0.01]">
                                <Users className="w-8 h-8 mx-auto mb-2 text-white/10" />
                                <p className="text-sm text-white/30">No employees found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#0f0f14] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">New Task</h3>
                            <button onClick={() => setShowCreateTask(false)} className="text-white/40 hover:text-white/70 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Title" className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all" autoFocus />
                            <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Description" className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all h-24 resize-none" />
                            <input type="number" value={taskReward} onChange={(e) => setTaskReward(e.target.value)} placeholder="Reward (tokens)" className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all" />
                            <select value={taskEmployee} onChange={(e) => setTaskEmployee(e.target.value)} className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-all">
                                <option value="">Select member</option>
                                {workspaceEmployees.map(({ employee }) => (
                                    <option key={employee.id} value={employee.wallet_address}>{employee.name}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={createTask} disabled={!taskTitle || !taskReward || !taskEmployee} className="w-full py-3 mt-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white rounded-xl font-medium disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25">
                            Create Task
                        </button>
                    </div>
                </div>
            )}

            {/* Toast */}
            {status && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#0f0f14]/95 backdrop-blur-2xl border border-white/[0.08] px-5 py-3 rounded-xl shadow-2xl z-50 animate-slide-up">
                    <p className="text-sm font-medium text-white">{status}</p>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-up { animation: slide-up 0.2s ease-out; }
            `}</style>
        </div>
    );
}
