import { useEffect, useState } from 'react';
import { initYellow } from '../yellow/client';

type YellowClient = Awaited<ReturnType<typeof initYellow>>;

export function useYellow() {
  const [client, setClient] = useState<YellowClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
  if (typeof window === 'undefined') return;

    initYellow()
      .then(setClient)
      .catch(setError);
  }, []);

  // console.error('Yellow Client Error:', error);
  return client;
}