import { useState, useEffect } from "preact/hooks";
import { api } from "./api";

export function useApi<T>(path: string, params?: Record<string, string>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = path + JSON.stringify(params ?? {});

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<T>(path, params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [key]);

  return { data, loading, error };
}
