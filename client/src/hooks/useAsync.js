import { useState, useEffect, useCallback } from 'react';

export function useAsync(asyncFn, deps = [], pollMs = 0) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    const timer = pollMs ? setInterval(run, pollMs) : null;
    return () => { if (timer) clearInterval(timer); };
  }, [run, pollMs]);

  return { data, loading, error, refetch: run };
}
