'use client';

import { useRouter } from 'next/navigation';
import { Briefcase, Users, Zap, Shield, TrendingUp, Clock, Sparkles, Award } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_50%)]"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-purple-900/50 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                  FluxPay
                </h1>
                <p className="text-xs text-purple-400/70">Performance-Based Payroll</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <p className="text-sm text-purple-400/70">Powered by Yellow Network</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-500/30 backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Instant Off-Chain Payments</span>
          </div>
          <h2 className="text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            Instant Payroll,<br />Zero Delays
          </h2>
          <p className="text-xl text-purple-300/80 max-w-2xl mx-auto">
            Performance-based compensation with instant off-chain payments and daily settlements on Yellow Network
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-6 mb-20">
          {[
            { icon: Zap, title: 'Instant Payments', desc: 'Off-chain payments settle in seconds', color: 'from-purple-500 to-fuchsia-500' },
            { icon: Shield, title: 'Secure Channels', desc: 'State channels ensure trustless transactions', color: 'from-fuchsia-500 to-pink-500' },
            { icon: TrendingUp, title: 'Performance-Based', desc: 'Pay for completed tasks, not just hours', color: 'from-emerald-500 to-green-500' }
          ].map((feature, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl bg-slate-900/50 border border-purple-500/20 backdrop-blur-sm p-6 hover:border-purple-500/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="relative font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{feature.title}</h3>
              <p className="relative text-sm text-purple-400/70">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* Manager Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border-2 border-purple-500/20 hover:border-purple-500 backdrop-blur-sm p-8 transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/50 group-hover:scale-110 transition-transform">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">Manager</h3>
              <p className="text-sm text-purple-400/70">Manage teams and process instant payments</p>
            </div>

            <div className="relative space-y-3 mb-6">
              {['Create workspaces & assign tasks', 'Open payment channels', 'Approve & pay instantly', 'Daily on-chain settlement'].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-500/30">
                    <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-purple-300/80">{item}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/manager')}
              className="relative w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50"
            >
              Continue as Manager
            </button>
          </div>

          {/* Employee Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border-2 border-fuchsia-500/20 hover:border-fuchsia-500 backdrop-blur-sm p-8 transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-fuchsia-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-fuchsia-500/50 group-hover:scale-110 transition-transform">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-fuchsia-300 transition-colors">Employee</h3>
              <p className="text-sm text-purple-400/70">Complete tasks and receive instant payments</p>
            </div>

            <div className="relative space-y-3 mb-6">
              {['View assigned tasks', 'Mark tasks complete', 'Get paid instantly', 'Track your earnings'].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-fuchsia-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border border-fuchsia-500/30">
                    <svg className="w-3 h-3 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-purple-300/80">{item}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/employee')}
              className="relative w-full px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-fuchsia-500/30 group-hover:shadow-fuchsia-500/50"
            >
              Continue as Employee
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-white text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Create Workspace', desc: 'Manager sets up workspace and opens payment channel', color: 'from-purple-500 to-fuchsia-500' },
              { num: '2', title: 'Assign Tasks', desc: 'Create tasks with rewards for employees', color: 'from-fuchsia-500 to-pink-500' },
              { num: '3', title: 'Complete & Pay', desc: 'Employees complete tasks, get paid instantly off-chain', color: 'from-emerald-500 to-green-500' },
              { num: '4', title: 'Daily Settlement', desc: 'Close channel and settle on-chain at end of day', color: 'from-amber-500 to-orange-500' }
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-xl group-hover:scale-110 transition-transform`}>
                  {step.num}
                </div>
                <h4 className="font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">{step.title}</h4>
                <p className="text-sm text-purple-400/70">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Session Info */}
        <div className="rounded-xl bg-amber-900/20 border border-amber-500/30 backdrop-blur-sm p-6 flex items-center gap-4">
          <Clock className="w-10 h-10 text-amber-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-300 mb-1">Daily Session: Until 3:59 PM IST</h4>
            <p className="text-sm text-amber-400/70">Employees can complete tasks during active session. Managers can settle channels anytime.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-purple-900/50 bg-slate-950/50 backdrop-blur-xl mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <p className="text-sm text-purple-400/70">Powered by Yellow Network</p>
            </div>
            <p className="text-sm text-purple-500/50">Built for ETHGlobal</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
