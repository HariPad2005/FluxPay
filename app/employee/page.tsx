'use client';

import { useYellow } from '../lib/hooks/useYellow';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import {
    Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, Sparkles,
    Copy, RefreshCw, Loader2, User, Briefcase, DollarSign, Filter,
    Zap, ArrowUpRight, Calendar, Target, Gift, Home, ListTodo,
    Receipt, Settings, Bell, ChevronRight, ExternalLink, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

// Types
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

interface Workspace {
    id: string;
    name: string;
}

// Skeleton Loader Component
const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse bg-white/5 rounded-lg", className)} />
);

// Stat Card Component
const StatCard = ({
    label,
    value,
    icon: Icon,
    trend,
    color = 'violet'
}: {
    label: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: 'violet' | 'emerald' | 'amber' | 'cyan';
}) => {
    const colors = {
        violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400',
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
        cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    };

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-default",
            colors[color]
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {trend && <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</p>}
                </div>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-white/5", colors[color].split(' ')[3])}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

// Task Row Component
const TaskRow = ({
    task,
    workspace,
    onComplete,
    isProcessing,
    sessionActive
}: {
    task: Task;
    workspace?: Workspace;
    onComplete: () => void;
    isProcessing: boolean;
    sessionActive: boolean;
}) => {
    const statusConfig = {
        pending: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        completed: { label: 'In Review', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        approved: { label: 'Approved', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
        paid: { label: 'Paid', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    };

    const status = statusConfig[task.status];

    return (
        <div className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
            <div className="flex items-center gap-4">
                {/* Left: Task Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm truncate">{task.title}</h4>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", status.bg, status.text, status.border)}>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mb-2">{task.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                        <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {workspace?.name || 'Workspace'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Right: Reward + Action */}
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className={cn(
                            "text-xl font-bold",
                            task.status === 'paid' ? "text-emerald-400" : "text-white"
                        )}>
                            {task.status === 'paid' && '+'}{task.reward_amount}
                        </p>
                        <p className="text-[10px] text-white/30">tokens</p>
                    </div>

                    {task.status === 'pending' && (
                        <button
                            onClick={onComplete}
                            disabled={isProcessing || !sessionActive}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/20"
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}
                        </button>
                    )}
                    {task.status === 'completed' && (
                        <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        </div>
                    )}
                    {task.status === 'paid' && (
                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Activity Item Component
const ActivityItem = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
        <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            task.status === 'paid' ? "bg-emerald-500/10" : "bg-violet-500/10"
        )}>
            {task.status === 'paid' ? (
                <DollarSign className="w-4 h-4 text-emerald-400" />
            ) : (
                <CheckCircle className="w-4 h-4 text-violet-400" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{task.title}</p>
            <p className="text-[10px] text-white/30">
                {task.paid_at ? new Date(task.paid_at).toLocaleDateString() : new Date(task.created_at).toLocaleDateString()}
            </p>
        </div>
        <p className={cn(
            "text-sm font-bold",
            task.status === 'paid' ? "text-emerald-400" : "text-white/60"
        )}>
            {task.status === 'paid' && '+'}{task.reward_amount}
        </p>
    </div>
);

// Nav Item Component
const NavItem = ({ icon: Icon, label, active, badge }: { icon: any; label: string; active?: boolean; badge?: number }) => (
    <button className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        active
            ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border border-violet-500/20"
            : "text-white/50 hover:text-white hover:bg-white/[0.03]"
    )}>
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && (
            <span className="px-1.5 py-0.5 bg-violet-500/20 rounded text-[10px] font-bold text-violet-400">{badge}</span>
        )}
    </button>
);

// Main Component
export default function EmployeeDashboard() {
    const yellow = useYellow();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
    const [balance, setBalance] = useState<string>('0');
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'paid'>('all');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [sessionActive, setSessionActive] = useState(false);

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
            setTimeRemaining(`${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            setSessionActive(true);
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionEndTime]);

    useEffect(() => {
        if (yellow?.account) {
            checkAndRegisterEmployee();
            loadTasks();
            loadBalance();
            const interval = setInterval(loadBalance, 10000);
            return () => clearInterval(interval);
        }
    }, [yellow?.account]);

    const checkAndRegisterEmployee = async () => {
        if (!yellow?.account) return;
        const { data } = await supabase
            .from('employees')
            .select('*')
            .eq('wallet_address', yellow.account.toLowerCase())
            .limit(1);

        if (data && data.length > 0) {
            setIsRegistered(true);
            setEmployeeName(data[0].name);
        } else {
            setShowNameInput(true);
        }
        setIsLoading(false);
    };

    const registerEmployee = async () => {
        if (!yellow?.account || !employeeName.trim()) {
            showStatusMsg('⚠️ Please enter your name');
            return;
        }
        setIsProcessing(true);
        const { data, error } = await supabase
            .from('employees')
            .insert({
                wallet_address: yellow.account.toLowerCase(),
                name: employeeName.trim(),
            })
            .select()
            .single();

        if (data) {
            setIsRegistered(true);
            setShowNameInput(false);
            showStatusMsg('✨ Welcome aboard!');
        } else if (error) {
            showStatusMsg('❌ Registration failed');
        }
        setIsProcessing(false);
    };

    const loadTasks = async () => {
        if (!yellow?.account) return;
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('employee_address', yellow.account.toLowerCase())
            .order('created_at', { ascending: false });

        if (data) {
            setTasks(data);
            const workspaceIds = [...new Set(data.map(t => t.workspace_id))];
            if (workspaceIds.length > 0) {
                const { data: wsData } = await supabase
                    .from('workspaces')
                    .select('id, name')
                    .in('id', workspaceIds);
                if (wsData) {
                    const wsMap: Record<string, Workspace> = {};
                    wsData.forEach(ws => wsMap[ws.id] = ws);
                    setWorkspaces(wsMap);
                }
            }
        }
    };

    const loadBalance = async () => {
        if (!yellow) return;
        try {
            const bal = await yellow.getBalance();
            setBalance(bal);
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([loadTasks(), loadBalance()]);
        setIsRefreshing(false);
        showStatusMsg('✅ Refreshed');
    };

    const markTaskCompleted = async (taskId: string) => {
        if (!sessionActive) {
            showStatusMsg('⏰ Session ended');
            return;
        }
        setProcessingTaskId(taskId);
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', taskId);

            if (!error) {
                loadTasks();
                showStatusMsg('🎉 Task completed!');
            } else {
                showStatusMsg('❌ Failed');
            }
        } catch (error) {
            showStatusMsg('❌ Error');
        } finally {
            setProcessingTaskId(null);
        }
    };

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(yellow?.account || '');
            showStatusMsg('✅ Copied');
        } catch {
            showStatusMsg('❌ Failed');
        }
    };

    const showStatusMsg = (msg: string) => {
        setStatus(msg);
        setTimeout(() => setStatus(''), 3000);
    };

    // Loading State
    if (!yellow) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }}></div>
                        <div className="absolute inset-1 rounded-full bg-[#09090b]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-violet-400" />
                        </div>
                    </div>
                    <p className="text-white/60 text-sm">Connecting...</p>
                </div>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const paidTasks = tasks.filter(t => t.status === 'paid');
    const totalEarned = paidTasks.reduce((sum, t) => sum + t.reward_amount, 0);
    const pendingEarnings = [...pendingTasks, ...completedTasks].reduce((sum, t) => sum + t.reward_amount, 0);
    const filteredTasks = tasks.filter(t => taskFilter === 'all' || t.status === taskFilter);
    const recentActivity = [...paidTasks, ...completedTasks].slice(0, 5);

    return (
        <div className="min-h-screen bg-[#09090b] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative flex h-screen">
                {/* Left Sidebar */}
                <aside className="w-64 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl flex flex-col">
                    {/* Logo */}
                    <div className="p-5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-white">FluxPay</h1>
                                <p className="text-[10px] text-white/40">Employee Portal</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1">
                        <NavItem icon={Home} label="Dashboard" active />
                        <NavItem icon={ListTodo} label="My Tasks" badge={pendingTasks.length} />
                        <NavItem icon={Receipt} label="Payments" />
                        <NavItem icon={Activity} label="Activity" />
                    </nav>

                    {/* Profile */}
                    <div className="p-4 border-t border-white/[0.06]">
                        <button onClick={copyAddress} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all group">
                            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                {employeeName.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-medium text-white truncate">{employeeName || 'Employee'}</p>
                                <p className="text-[10px] text-white/30 font-mono truncate">{yellow.account?.slice(0, 8)}...{yellow.account?.slice(-4)}</p>
                                <p className="text-[10px] text-white/30 font-mono truncate">{yellow.ensName || 'Employee'}</p>
                            </div>
                            <Copy className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="h-16 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-white">Dashboard</h2>
                            <button onClick={refreshData} disabled={isRefreshing} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors disabled:opacity-50">
                                <RefreshCw className={cn("w-4 h-4 text-white/40", isRefreshing && "animate-spin")} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Live Balance */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">{balance}</span>
                            </div>
                            {/* Session Timer */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                                <div className={cn("w-1.5 h-1.5 rounded-full", sessionActive ? "bg-emerald-400 animate-pulse" : "bg-red-400")}></div>
                                <span className="text-xs font-mono text-white/60">{timeRemaining}</span>
                            </div>
                            {/* Notifications */}
                            <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors relative">
                                <Bell className="w-4 h-4 text-white/40" />
                                {pendingTasks.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        <div className="p-6">
                            {/* Balance Hero */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/20 border border-white/[0.08] p-6 mb-6">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl"></div>
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-white/50 mb-1">Available Balance</p>
                                        <p className="text-4xl font-bold text-white mb-2">{balance} <span className="text-lg text-white/40">tokens</span></p>
                                        <p className="text-xs text-white/30 flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            Yellow Network • Instant Settlement
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4" />
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Earned" value={totalEarned.toFixed(2)} icon={TrendingUp} color="emerald" trend="+12%" />
                                <StatCard label="Pending" value={pendingEarnings.toFixed(2)} icon={Clock} color="amber" />
                                <StatCard label="Tasks Done" value={paidTasks.length} icon={CheckCircle} color="violet" />
                                <StatCard label="Active Tasks" value={pendingTasks.length} icon={Target} color="cyan" />
                            </div>

                            {/* Tasks Section */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">My Tasks</h3>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={taskFilter}
                                        onChange={(e) => setTaskFilter(e.target.value as typeof taskFilter)}
                                        className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-white/60 focus:outline-none cursor-pointer"
                                    >
                                        <option value="all" className="bg-[#09090b]">All</option>
                                        <option value="pending" className="bg-[#09090b]">Pending</option>
                                        <option value="completed" className="bg-[#09090b]">In Review</option>
                                        <option value="paid" className="bg-[#09090b]">Paid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                        <Target className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                        <p className="text-sm text-white/40">No tasks found</p>
                                    </div>
                                ) : (
                                    filteredTasks.map(task => (
                                        <TaskRow
                                            key={task.id}
                                            task={task}
                                            workspace={workspaces[task.workspace_id]}
                                            onComplete={() => markTaskCompleted(task.id)}
                                            isProcessing={processingTaskId === task.id}
                                            sessionActive={sessionActive}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-72 border-l border-white/[0.06] bg-black/20 backdrop-blur-xl flex flex-col">
                    {/* Quick Stats */}
                    <div className="p-5 border-b border-white/[0.06]">
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Earnings</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/50">Total Earned</span>
                                <span className="text-sm font-bold text-emerald-400">{totalEarned.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/50">Pending</span>
                                <span className="text-sm font-bold text-amber-400">{pendingEarnings.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/50">This Week</span>
                                <span className="text-sm font-bold text-white">+{(totalEarned * 0.3).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Session Status */}
                    {!sessionActive && (
                        <div className="p-5 border-b border-white/[0.06]">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <div>
                                        <p className="text-sm font-medium text-red-300">Session Ended</p>
                                        <p className="text-xs text-red-400/60">Cannot complete tasks</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity */}
                    <div className="flex-1 p-5 overflow-auto">
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                            <p className="text-xs text-white/30 text-center py-8">No activity yet</p>
                        ) : (
                            <div className="space-y-0">
                                {recentActivity.map(task => (
                                    <ActivityItem key={task.id} task={task} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Help */}
                    <div className="p-5 border-t border-white/[0.06]">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 hover:from-violet-600/30 hover:to-cyan-600/30 border border-violet-500/20 rounded-xl text-sm font-medium text-white/80 transition-all">
                            <Sparkles className="w-4 h-4" />
                            Need Help?
                        </button>
                    </div>
                </aside>
            </div>

            {/* Registration Modal */}
            {showNameInput && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute -inset-px bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-8">
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Welcome to FluxPay</h3>
                                <p className="text-sm text-white/40">Enter your name to get started</p>
                            </div>
                            <div className="relative mb-4">
                                <User className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={employeeName}
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
                                    onKeyPress={(e) => e.key === 'Enter' && registerEmployee()}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={registerEmployee}
                                disabled={isProcessing || !employeeName.trim()}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {status && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#0c0c0f] border border-white/[0.08] rounded-lg shadow-xl animate-slide-up">
                    <p className="text-sm text-white">{status}</p>
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
