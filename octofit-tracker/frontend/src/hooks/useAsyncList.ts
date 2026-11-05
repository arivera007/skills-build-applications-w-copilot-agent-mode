import { useEffect, useState } from 'react';

export type ListState<T> = { loading: boolean; error?: string; items?: T[] };

export function useAsyncList<T>(load: () => Promise<T[]>): ListState<T> {
  const [state, setState] = useState<ListState<T>>({ loading: true });

  useEffect(() => {
    let active = true;
    load()
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('Unexpected API response');
        if (active) setState({ loading: false, items });
      })
      .catch((cause: unknown) => {
        if (active) setState({ loading: false, error: cause instanceof Error ? cause.message : 'Unable to load data' });
      });
    return () => {
      active = false;
    };
    // Each route's loader is constant, so the request runs once on mount.
  }, []);

  return state;
}
