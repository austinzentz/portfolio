import { useCallback, useEffect, useState } from "react";

/**
 * State that persists to localStorage for this visitor only.
 * Renders `initial` on the server and first paint, then loads any saved copy.
 * Storage can be unavailable (private mode, blocked cookies); the demo still works, it just won't remember.
 */
export function useLocalState<T>(key: string, initial: T, isValid: (v: unknown) => v is T) {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValid(parsed)) setState(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state, loaded]);

  const reset = useCallback(() => setState(initial), [initial]);
  return [state, setState, reset] as const;
}
