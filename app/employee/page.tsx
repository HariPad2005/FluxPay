'use client';

import { useYellow } from '../lib/hooks/useYellow';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client';
import {
    Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, Sparkles,
    Copy, RefreshCw, Loader2, User, Briefcase, DollarSign, Filter,
    Zap, ArrowUpRight, Calendar, Target, Gift, Home, ListTodo,
    Receipt, Settings, Bell, ChevronRight, ExternalLink, Activity,
    Upload, X, Image, FileText
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
            "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.02] hover:shadow-lg cursor-default",
            colors[color]
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-white/50 uppercase tracking-wider font-medium mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    {trend && <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" />{trend}</p>}
                </div>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-white/5", colors[color].split(' ')[3])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

// Activity Item Component
const ActivityItem = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0">
        <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            task.status === 'paid' ? "bg-emerald-500/10" : "bg-violet-500/10"
        )}>
            {task.status === 'paid' ? (
                <DollarSign className="w-5 h-5 text-emerald-400" />
            ) : (
                <CheckCircle className="w-5 h-5 text-violet-400" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{task.title}</p>
            <p className="text-xs text-white/30 mt-0.5">
                {task.paid_at ? new Date(task.paid_at).toLocaleDateString() : new Date(task.created_at).toLocaleDateString()}
            </p>
        </div>
        <p className={cn(
            "text-base font-bold",
            task.status === 'paid' ? "text-emerald-400" : "text-white/60"
        )}>
            {task.status === 'paid' && '+'}${task.reward_amount}
        </p>
    </div>
);

// Nav Item Component
const NavItem = ({ icon: Icon, label, active, badge }: { icon: any; label: string; active?: boolean; badge?: number }) => (
    <button className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
        active
            ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/10 text-white border border-violet-500/20"
            : "text-white/50 hover:text-white hover:bg-white/[0.03]"
    )}>
        <Icon className="w-5 h-5" />
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
            <span className="px-2 py-1 bg-violet-500/20 rounded-lg text-xs font-bold text-violet-400">{badge}</span>
        )}
    </button>
);

// Main Component
export default function EmployeeDashboard() {
    const yellow = useYellow();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
    const [balance, setBalance] = useState<string>('0.00');
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

    // Proof of work modal state
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string>('');

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
            const bal = await yellow.getCustodyBalance('0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb');
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

    const openProofModal = (task: Task) => {
        setSelectedTask(task);
        setProofFile(null);
        setProofPreview('');
        setShowProofModal(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setProofPreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setProofPreview('');
            }
        }
    };

    const submitTaskCompletion = async () => {
        if (!selectedTask || !proofFile) {
            showStatusMsg('⚠️ Please upload proof of work');
            return;
        }
        if (!sessionActive) {
            showStatusMsg('⏰ Session ended');
            return;
        }

        setProcessingTaskId(selectedTask.id);
        try {
            // In a real app, you would upload the file to storage here
            // For now, we'll just mark the task as completed
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', selectedTask.id);

            if (!error) {
                loadTasks();
                showStatusMsg('🎉 Task submitted for review!');
                setShowProofModal(false);
                setSelectedTask(null);
                setProofFile(null);
                setProofPreview('');
            } else {
                showStatusMsg('❌ Failed to submit');
            }
        } catch (error) {
            showStatusMsg('❌ Error submitting task');
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
            <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.12),transparent_50%)]" />
                <div className="text-center relative z-10">
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }}></div>
                        <div className="absolute inset-1.5 rounded-full bg-[#08080c]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap className="w-8 h-8 text-violet-400" />
                        </div>
                    </div>
                    <p className="text-white font-semibold text-xl">Connecting to Yellow Network</p>
                    <p className="text-white/40 text-base mt-3">Approve the connection in your wallet</p>
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
        <div className="min-h-screen bg-[#08080c] text-white">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,80,255,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(80,200,255,0.06),transparent_50%)]" />
            </div>

            <div className="relative flex h-screen">
                {/* Left Sidebar */}
                <aside className="w-72 border-r border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-white/[0.08]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">FluxPay Employee</h1>
                                <p className="text-xs text-white/40">Portal Dashboard</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-5 space-y-2">
                        <NavItem icon={Home} label="Dashboard" active />
                        <NavItem icon={ListTodo} label="My Tasks" badge={pendingTasks.length} />
                        <NavItem icon={Receipt} label="Payments" />
                        <NavItem icon={Activity} label="Activity" />
                    </nav>

                    {/* Profile */}
                    <div className="p-5 border-t border-white/[0.08]">
                        <button onClick={copyAddress} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-all group">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-violet-500/25">
                                {employeeName.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-base font-semibold text-white truncate">{employeeName || 'Employee'}</p>
                                {/* <p className="text-sm text-white/35 font-mono truncate mt-0.5">{yellow.account?.slice(0, 10)}...{yellow.account?.slice(-6)}</p> */}
                                <p className="text-sm text-white/35 font-mono truncate mt-0.5">harry.eth</p>

                            </div>
                            <Copy className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="h-20 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex items-center justify-between px-8">
                        <div className="flex items-center gap-5">
                            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                            <button onClick={refreshData} disabled={isRefreshing} className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors disabled:opacity-50">
                                <RefreshCw className={cn("w-5 h-5 text-white/40", isRefreshing && "animate-spin")} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Live Balance */}
                            <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <Wallet className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <span className="text-lg font-bold text-emerald-400">${balance}</span>
                                    <p className="text-xs text-emerald-400/60">Balance</p>
                                </div>
                            </div>
                            {/* Session Timer */}
                            <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl">
                                <div className={cn("w-3 h-3 rounded-full", sessionActive ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" : "bg-red-400")} />
                                <div>
                                    <span className="text-lg font-semibold text-white">{timeRemaining}</span>
                                    <p className="text-xs text-white/40">Session</p>
                                </div>
                            </div>
                            {/* Notifications */}
                            <button className="p-3 rounded-xl hover:bg-white/[0.05] transition-colors relative">
                                <Bell className="w-5 h-5 text-white/40" />
                                {pendingTasks.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-violet-500 rounded-full" />
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        <div className="p-8">
                            {/* Balance Hero */}
                            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/20 border border-white/[0.1] p-8 mb-8">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl" />
                                <div className="relative flex items-center justify-between">
                                    <div>
                                        <p className="text-base text-white/50 mb-2">Available Balance</p>
                                        <p className="text-5xl font-bold text-white mb-3">${balance} <span className="text-xl text-white/40">USDC</span></p>
                                        <p className="text-sm text-white/35 flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            Yellow Network • Instant Settlement
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-base font-medium transition-all flex items-center gap-2">
                                            <ExternalLink className="w-5 h-5" />
                                            Withdraw
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-5 mb-8">
                                <StatCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} icon={TrendingUp} color="emerald" trend="+12%" />
                                <StatCard label="Pending" value={`$${pendingEarnings.toFixed(2)}`} icon={Clock} color="amber" />
                                <StatCard label="Tasks Done" value={paidTasks.length} icon={CheckCircle} color="violet" />
                                <StatCard label="Active Tasks" value={pendingTasks.length} icon={Target} color="cyan" />
                            </div>

                            {/* Tasks Section */}
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-white">My Tasks</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                                        <Filter className="w-4 h-4 text-white/35" />
                                        <select
                                            value={taskFilter}
                                            onChange={(e) => setTaskFilter(e.target.value as typeof taskFilter)}
                                            className="bg-transparent text-sm text-white/80 focus:outline-none cursor-pointer"
                                        >
                                            <option value="all" className="bg-[#08080c]">All Tasks</option>
                                            <option value="pending" className="bg-[#08080c]">Pending</option>
                                            <option value="completed" className="bg-[#08080c]">In Review</option>
                                            <option value="paid" className="bg-[#08080c]">Paid</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-16 bg-white/[0.02] border border-white/[0.08] rounded-2xl">
                                        <Target className="w-14 h-14 text-white/10 mx-auto mb-4" />
                                        <p className="text-base text-white/40">No tasks found</p>
                                        <p className="text-sm text-white/25 mt-1">Check back later for new assignments</p>
                                    </div>
                                ) : (
                                    filteredTasks.map(task => {
                                        const workspace = workspaces[task.workspace_id];
                                        const statusConfig = {
                                            pending: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
                                            completed: { label: 'In Review', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
                                            approved: { label: 'Approved', bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
                                            paid: { label: 'Paid', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                                        };
                                        const status = statusConfig[task.status];

                                        return (
                                            <div key={task.id} className="group relative bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
                                                <div className="flex items-center gap-5">
                                                    {/* Left: Task Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-semibold text-white text-lg truncate">{task.title}</h4>
                                                            <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", status.bg, status.text, status.border)}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/45 truncate mb-3">{task.description}</p>
                                                        <div className="flex items-center gap-4 text-sm text-white/35">
                                                            <span className="flex items-center gap-1.5">
                                                                <Briefcase className="w-4 h-4" />
                                                                {workspace?.name || 'Workspace'}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Calendar className="w-4 h-4" />
                                                                {new Date(task.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: Reward + Action */}
                                                    <div className="flex items-center gap-5">
                                                        <div className="text-right">
                                                            <p className={cn(
                                                                "text-2xl font-bold",
                                                                task.status === 'paid' ? "text-emerald-400" : "text-white"
                                                            )}>
                                                                {task.status === 'paid' && '+'}${task.reward_amount}
                                                            </p>
                                                            <p className="text-xs text-white/35">USDC</p>
                                                        </div>

                                                        {task.status === 'pending' && (
                                                            <button
                                                                onClick={() => openProofModal(task)}
                                                                disabled={processingTaskId === task.id || !sessionActive}
                                                                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-base font-semibold transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25 flex items-center gap-2"
                                                            >
                                                                {processingTaskId === task.id ? (
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Upload className="w-5 h-5" />
                                                                        Complete
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        {task.status === 'completed' && (
                                                            <div className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2">
                                                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                                                <span className="text-sm text-blue-400">In Review</span>
                                                            </div>
                                                        )}
                                                        {task.status === 'paid' && (
                                                            <div className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                                <span className="text-sm text-emerald-400">Paid</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className="w-80 border-l border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col">
                    {/* Quick Stats */}
                    <div className="p-6 border-b border-white/[0.08]">
                        <h3 className="text-sm font-semibold text-white/45 uppercase tracking-wider mb-5">Earnings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-base text-white/50">Total Earned</span>
                                <span className="text-base font-bold text-emerald-400">${totalEarned.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-base text-white/50">Pending</span>
                                <span className="text-base font-bold text-amber-400">${pendingEarnings.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-base text-white/50">This Week</span>
                                <span className="text-base font-bold text-white">+${(totalEarned * 0.3).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Session Status */}
                    {!sessionActive && (
                        <div className="p-6 border-b border-white/[0.08]">
                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                    <div>
                                        <p className="text-base font-semibold text-red-300">Session Ended</p>
                                        <p className="text-sm text-red-400/60">Cannot complete tasks</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity */}
                    <div className="flex-1 p-6 overflow-auto">
                        <h3 className="text-sm font-semibold text-white/45 uppercase tracking-wider mb-5">Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-12">No activity yet</p>
                        ) : (
                            <div className="space-y-0">
                                {recentActivity.map(task => (
                                    <ActivityItem key={task.id} task={task} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Help */}
                    <div className="p-6 border-t border-white/[0.08]">
                        <button className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 hover:from-violet-600/30 hover:to-cyan-600/30 border border-violet-500/20 rounded-2xl text-base font-medium text-white/80 transition-all">
                            <Sparkles className="w-5 h-5" />
                            Need Help?
                        </button>
                    </div>
                </aside>
            </div>

            {/* Proof of Work Modal */}
            {showProofModal && selectedTask && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0c0c12] border border-white/[0.1] rounded-2xl p-8 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Submit Task Completion</h3>
                                <p className="text-sm text-white/45 mt-1">Upload proof of work for "{selectedTask.title}"</p>
                            </div>
                            <button
                                onClick={() => { setShowProofModal(false); setSelectedTask(null); setProofFile(null); setProofPreview(''); }}
                                className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Task Info */}
                        <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl mb-6">
                            <div className="flex items-center justify-between">
                                <p className="text-base text-white font-medium">{selectedTask.title}</p>
                                <p className="text-xl font-bold text-emerald-400">${selectedTask.reward_amount}</p>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/60 mb-3">Proof of Work (Screenshot/File)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {!proofFile ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full p-8 border-2 border-dashed border-white/[0.15] rounded-2xl hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload className="w-7 h-7 text-violet-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base text-white/70 font-medium">Click to upload file</p>
                                            <p className="text-sm text-white/35 mt-1">PNG, JPG, PDF up to 10MB</p>
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <div className="relative p-5 bg-white/[0.03] border border-white/[0.1] rounded-2xl">
                                    <button
                                        onClick={() => { setProofFile(null); setProofPreview(''); }}
                                        className="absolute top-3 right-3 p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    {proofPreview ? (
                                        <div className="flex items-center gap-4">
                                            <img src={proofPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl" />
                                            <div>
                                                <p className="text-base text-white font-medium truncate">{proofFile.name}</p>
                                                <p className="text-sm text-white/40">{(proofFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                                <FileText className="w-7 h-7 text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-base text-white font-medium truncate">{proofFile.name}</p>
                                                <p className="text-sm text-white/40">{(proofFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={submitTaskCompletion}
                            disabled={!proofFile || processingTaskId === selectedTask.id || !sessionActive}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-base font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                        >
                            {processingTaskId === selectedTask.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5" />
                            )}
                            Submit for Review
                        </button>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showNameInput && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative w-full max-w-md">
                        <div className="absolute -inset-px bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-30" />
                        <div className="relative bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-10">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-500/30">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Welcome to FluxPay</h3>
                                <p className="text-base text-white/40">Enter your name to get started</p>
                            </div>
                            <div className="relative mb-5">
                                <User className="w-5 h-5 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={employeeName}
                                    onChange={(e) => setEmployeeName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full pl-12 pr-5 py-4 bg-white/[0.04] border border-white/[0.1] rounded-xl text-base text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 transition-all"
                                    onKeyPress={(e) => e.key === 'Enter' && registerEmployee()}
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={registerEmployee}
                                disabled={isProcessing || !employeeName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-base font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {status && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 bg-[#0c0c0f]/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl animate-slide-up">
                    <p className="text-base font-medium text-white">{status}</p>
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
