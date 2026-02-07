'use client';

import { useYellow } from '@/hooks/useYellow';

export default function Home() {
  const yellow = useYellow();

  if (!yellow) return <div>Connecting...</div>;

  return (
    <div>
      <button onClick={() => yellow.createSession('0xPartnerAddress')}>
        Create Session
      </button>

      <button onClick={() => yellow.pay(100000, '0xPartnerAddress')}>
        Send Payment
      </button>
    </div>
  );
}
