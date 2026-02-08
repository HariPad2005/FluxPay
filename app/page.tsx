'use client';

import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Zap,
  Shield,
  TrendingUp,
  Award,
  Clock,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(200,80,255,0.06),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#08080c]/80 backdrop-blur-2xl">
        <div className="w-full max-w-[1400px] mx-auto px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FluxPay</h1>
              <p className="text-sm text-white/40">Performance-Based Payroll</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Powered by Yellow Network</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-12">

        {/* Hero Section */}
        <section className="py-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-10">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300 font-medium">Instant Off-Chain Payments</span>
          </div>

          <h2 className="text-6xl font-extrabold leading-[1.1] mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Instant Payroll,<br />Zero Delays
          </h2>

          <p className="flex items-center justify-center gap-4">
            Performance-based compensation with instant off-chain payments
            and secure daily settlements powered by Yellow Network.
          </p>
        </section>

        {/* Features */}
        <section className="pb-28">
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Instant Payments',
                desc: 'Payments settle within seconds using off-chain state channels',
                color: 'violet',
              },
              {
                icon: Shield,
                title: 'Secure Channels',
                desc: 'Trustless and cryptographically secure payment transfers',
                color: 'fuchsia',
              },
              {
                icon: TrendingUp,
                title: 'Performance Based',
                desc: 'Pay only for verified and completed work tasks',
                color: 'cyan',
              },
            ].map((f, i) => {
              const colors = {
                violet: 'from-violet-500/15 to-violet-600/5 border-violet-500/20 text-violet-400',
                fuchsia: 'from-fuchsia-500/15 to-fuchsia-600/5 border-fuchsia-500/20 text-fuchsia-400',
                cyan: 'from-cyan-500/15 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
              };
              const colorClass = colors[f.color as keyof typeof colors];

              return (
                <div
                  key={i}
                  className={`rounded-2xl bg-gradient-to-br ${colorClass} border p-8 transition-all hover:scale-[1.02] hover:shadow-2xl`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6">
                    <f.icon className={`w-7 h-7 ${colorClass.split(' ')[3]}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-base text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Role Cards */}
        <section className="pb-28">
          <h3 className="text-4xl font-bold text-center mb-14">Get Started</h3>

          <div className="grid grid-cols-2 gap-10">
            {/* Manager Card */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 p-10 transition-all hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-8 shadow-xl shadow-violet-500/30">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-3xl font-bold text-white mb-4">Manager</h3>
                <p className="text-lg text-white/45 mb-8">Create workspaces, assign tasks, and pay your team instantly.</p>

                <ul className="space-y-4 mb-10">
                  {['Create workspaces & assign tasks', 'Open payment channels', 'Approve & pay instantly', 'Daily on-chain settlement'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-white/60">
                      <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/manager')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-violet-500/25"
                >
                  Continue as Manager
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Employee Card */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 p-10 transition-all hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center mb-8 shadow-xl shadow-cyan-500/30">
                  <Award className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-3xl font-bold text-white mb-4">Employee</h3>
                <p className="text-lg text-white/45 mb-8">Complete tasks, submit proofs, and get paid instantly.</p>

                <ul className="space-y-4 mb-10">
                  {['View assigned tasks', 'Upload proof of work', 'Get paid instantly', 'Track your earnings'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-base text-white/60">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/employee')}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-semibold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25"
                >
                  Continue as Employee
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="pb-28">
          <h3 className="text-4xl font-bold text-center mb-14">How It Works</h3>

          <div className="grid grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Workspace', desc: 'Set up your team workspace' },
              { step: '02', title: 'Assign Tasks', desc: 'Add tasks with rewards' },
              { step: '03', title: 'Complete & Pay', desc: 'Instant off-chain payment' },
              { step: '04', title: 'Settlement', desc: 'Daily on-chain settlement' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center font-bold text-xl mb-6 shadow-xl shadow-violet-500/25">
                  {item.step}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-white/45">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Session Info */}
        <section className="pb-20">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-8 py-6 flex items-center justify-center gap-4">
            <Clock className="w-6 h-6 text-amber-400" />
            <p className="text-lg text-amber-300">
              <span className="font-semibold">Daily Session:</span> Until 9:59 PM IST. Managers can settle anytime.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#08080c]/80 backdrop-blur-xl">
        <div className="w-full max-w-[1400px] mx-auto px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold">FluxPay</span>
          </div>
          <p className="text-sm text-white/40">
            Powered by Yellow Network • Built for ETHGlobal
          </p>
        </div>
      </footer>
    </div>
  );
}