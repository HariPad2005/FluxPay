'use client';

import { useYellow } from './lib/hooks/useYellow';

export default function Home() {
  const yellow = useYellow();

  if (!yellow) return <div>Connecting...</div>;

  return (
    <div>
      <button onClick={() => yellow.openChannel('0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb')}>
        Open Channel
      </button>
      <button onClick={() => yellow.pay(100000, '0xa4200162309D1F65CC1eadDe023ba42Ccfb6eD16')}>
        Send Payment
      </button>
    </div>
  );
}
