import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, apiMode } from "../api";
import type { Profile, User } from "../types";

const SessionContext = createContext<{
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      if (!me) {
        setUser(null);
        setProfile(null);
      } else {
        const result = await api.profile();
        setUser(me);
        setProfile(result);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "세션을 확인하지 못했습니다.");
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        setProfile(null);
      }
    } finally {
      setReady(true);
    }
  }, []);
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const clear = () => {
      setUser(null);
      setProfile(null);
    };
    window.addEventListener("tunit:unauthorized", clear);
    return () => window.removeEventListener("tunit:unauthorized", clear);
  }, []);
  const value = useMemo(
    () => ({ user, profile, ready, error, refresh, logout }),
    [user, profile, ready, error, refresh, logout],
  );
  return (
    <SessionContext.Provider value={value}>
      {apiMode === "mock" && (
        <div className="demo-banner" role="note">
          로컬 프론트 데모 · 계정과 취향은 이 브라우저에만 저장됩니다. 실제 서버
          인증·DB와 연결되지 않았습니다.
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is required");
  return session;
}
