import { useCallback, useEffect, useState } from "react";
export function useResource<T>(loader: () => Promise<T>, key: string) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<Error | null>(null),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    loader()
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e : new Error("불러오지 못했습니다."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [key, revision]);
  const reload = useCallback(() => setRevision((v) => v + 1), []);
  return { data, loading, error, reload };
}
