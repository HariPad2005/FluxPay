import { useEffect, useState } from 'react';
import { initYellow } from '@/lib/yellow/client';

export function useYellow() {
  const [client, setClient] = useState(null);

  useEffect(() => {
    initYellow().then(setClient);
  }, []);

  return client;
}
