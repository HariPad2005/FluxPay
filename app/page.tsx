'use client';

import { useYellow } from './lib/hooks/useYellow';

export default function Home() {
  const yellow = useYellow();

  if (!yellow) return <div>Connecting...</div>;

  return (
    <div>
      <button onClick={() => yellow.openChannel('0x941845F7425141d19bE9db618C525e333C11b1c2')}>
        Open Channel
      </button>
      <button onClick={() => yellow.pay(100000, '0x941845F7425141d19bE9db618C525e333C11b1c2')}>
        Send Payment
      </button>
    </div>
  );
}
