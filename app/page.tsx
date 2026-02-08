'use client';

import { useYellow } from './lib/hooks/useYellow';
import { useState, useEffect } from 'react';

export default function Home() {
  const yellow = useYellow();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    setStatus('Initiating payment flow...');

    try {
      await yellow?.executePaymentFlow(
        '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb',
        1n,
        1n,
        1,
        '0xa4200162309D1F65CC1eadDe023ba42Ccfb6eD16'
      );
      setStatus('Payment completed successfully! 🎉');
    } catch (error) {
      setStatus('Payment failed. Please try again.');
      console.error(error);
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  if (!yellow) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="glass rounded-3xl p-12 max-w-md w-full mx-4 animate-fade-in">
          <div className="flex flex-col items-center space-y-6">
            {/* Enhanced Loading Spinner */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              <div className="absolute inset-0 w-24 h-24 border-4 border-pink-500/10 border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
              {/* Pulsing center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Connecting to Yellow Network
              </h2>
              <p className="text-gray-400">Initializing secure payment channel...</p>
              <div className="flex items-center justify-center space-x-1 pt-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className={`max-w-5xl w-full transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Header with enhanced styling */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-20 blur-3xl">
            <div className="w-96 h-96 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <h1 className="text-7xl md:text-8xl font-black mb-6 relative">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              FluxPay
            </span>
          </h1>
          <p className="text-2xl text-gray-300 font-light tracking-wide">Lightning-fast payments on Yellow Network</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">Live on Mainnet</span>
          </div>
        </div>

        {/* Main Card with enhanced design */}
        <div className="glass rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all duration-500">
          {/* Stats Grid with enhanced animations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass rounded-2xl p-6 border-l-4 border-indigo-500 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Network</p>
                  <p className="text-3xl font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">Yellow</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border-l-4 border-purple-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Status</p>
                  <p className="text-3xl font-bold text-green-400 mt-2 flex items-center">
                    <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                    Ready
                  </p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-purple-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border-l-4 border-pink-500 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Amount</p>
                  <p className="text-3xl font-bold text-white mt-2 group-hover:text-pink-400 transition-colors">5 Tokens</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-pink-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details with enhanced design */}
          <div className="glass rounded-2xl p-8 mb-8 border border-white/5 hover:border-white/10 transition-all duration-300">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Payment Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-700/30 hover:border-gray-600/50 transition-colors group">
                <span className="text-gray-400 font-medium">Token Address</span>
                <span className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg group-hover:bg-indigo-500/20 transition-colors">0xDB9F...2DEb</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700/30 hover:border-gray-600/50 transition-colors group">
                <span className="text-gray-400 font-medium">Recipient</span>
                <span className="text-sm font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg group-hover:bg-purple-500/20 transition-colors">0xa420...6eD16</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700/30 hover:border-gray-600/50 transition-colors group">
                <span className="text-gray-400 font-medium">Deposit Amount</span>
                <span className="text-white font-bold text-lg group-hover:text-pink-400 transition-colors">50 Tokens</span>
              </div>
              <div className="flex justify-between items-center py-3 group">
                <span className="text-gray-400 font-medium">Transfer Amount</span>
                <span className="text-white font-bold text-lg group-hover:text-pink-400 transition-colors">5 Tokens</span>
              </div>
            </div>
          </div>

          {/* Status Message with enhanced styling */}
          {status && (
            <div className={`glass rounded-2xl p-5 mb-8 border-l-4 animate-slide-in ${status.includes('success') ? 'border-green-500 bg-green-500/5' :
              status.includes('failed') ? 'border-red-500 bg-red-500/5' :
                'border-yellow-500 bg-yellow-500/5'
              }`}>
              <div className="flex items-center gap-3">
                {status.includes('success') && (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <p className="text-base font-medium">{status}</p>
              </div>
            </div>
          )}

          {/* Enhanced Action Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`
              w-full py-7 px-8 rounded-2xl font-bold text-xl
              bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
              hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
              transform hover:scale-[1.02] active:scale-[0.98]
              shadow-2xl hover:shadow-3xl
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              relative overflow-hidden
              group
              transition-all duration-300
            `}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </>
              ) : (
                <>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Execute Payment Flow
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>

          {/* Info Footer with enhanced design */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-6 py-3 rounded-full border border-white/10">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Powered by Yellow Network</span>
              <span className="text-gray-600">•</span>
              <span>Secure</span>
              <span className="text-gray-600">•</span>
              <span>Instant</span>
              <span className="text-gray-600">•</span>
              <span>Decentralized</span>
            </div>
          </div>
        </div>

        {/* Feature Cards with enhanced design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="glass rounded-2xl p-8 text-center hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-indigo-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-bold text-xl mb-3 text-white group-hover:text-indigo-400 transition-colors">Secure</h4>
            <p className="text-sm text-gray-400 leading-relaxed">End-to-end encrypted transactions with military-grade security</p>
          </div>

          <div className="glass rounded-2xl p-8 text-center hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group border border-white/5 hover:border-purple-500/30">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-bold text-xl mb-3 text-white group-hover:text-purple-400 transition-colors">Instant</h4>
            <p className="text-sm text-gray-400 leading-relaxed">Lightning-fast settlement in milliseconds, not minutes</p>
          </div>

          <div className="glass rounded-2xl p-8 text-center hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 group border border-white/5 hover:border-pink-500/30">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-pink-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h4 className="font-bold text-xl mb-3 text-white group-hover:text-pink-400 transition-colors">Low Fees</h4>
            <p className="text-sm text-gray-400 leading-relaxed">Minimal transaction costs with maximum efficiency</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-20px) translateX(5px);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
