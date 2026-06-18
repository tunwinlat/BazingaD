'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { SPORTS_LEAGUES, type SportEvent } from '@/lib/sports';

interface PinnedMatch extends SportEvent {
  finishedAt?: string;
}

interface SportsContextValue {
  events: SportEvent[];
  pinned: PinnedMatch[];
  loading: boolean;
  error: string | null;
  enabledLeagues: string[];
  toggleLeague: (slug: string) => void;
  pinMatch: (event: SportEvent) => void;
  unpinMatch: (id: string) => void;
  registerInterest: () => void;
  unregisterInterest: () => void;
}

const SportsContext = createContext<SportsContextValue | null>(null);

const LEAGUES_STORAGE_KEY = 'sports-enabled-leagues';
const PINNED_STORAGE_KEY = 'sports-pinned-matches';
const AUTO_UNPIN_MINUTES = 30;
const REFRESH_INTERVAL_MS = 60000;

export function SportsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledLeagues, setEnabledLeagues] = useState<string[]>(
    SPORTS_LEAGUES.map((l) => l.slug)
  );
  const [pinned, setPinned] = useState<PinnedMatch[]>([]);
  const [interestCount, setInterestCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const registerInterest = useCallback(() => {
    setInterestCount((c) => c + 1);
  }, []);

  const unregisterInterest = useCallback(() => {
    setInterestCount((c) => Math.max(0, c - 1));
  }, []);

  const shouldFetch = interestCount > 0 || pinned.length > 0;

  // Load persisted preferences on the client after hydration
  useEffect(() => {
    try {
      const savedLeagues = localStorage.getItem(LEAGUES_STORAGE_KEY);
      if (savedLeagues) {
        const parsed = JSON.parse(savedLeagues) as string[];
        const valid = SPORTS_LEAGUES.map((l) => l.slug);
        setEnabledLeagues(parsed.filter((slug) => valid.includes(slug)));
      }
    } catch {
      // ignore
    }
    try {
      const savedPinned = localStorage.getItem(PINNED_STORAGE_KEY);
      if (savedPinned) {
        setPinned(JSON.parse(savedPinned) as PinnedMatch[]);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist enabled leagues
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LEAGUES_STORAGE_KEY, JSON.stringify(enabledLeagues));
    } catch {
      // ignore
    }
  }, [enabledLeagues, hydrated]);

  // Persist pinned matches
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinned));
    } catch {
      // ignore
    }
  }, [pinned, hydrated]);

  // Fetch live scores
  useEffect(() => {
    if (!shouldFetch) return;

    let cancelled = false;

    const fetchScores = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('leagues', enabledLeagues.join(','));
        const res = await fetch(`/api/sports/scores?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch scores');
        const data = (await res.json()) as { events?: SportEvent[] };
        if (!cancelled) {
          setEvents(data.events || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error loading scores');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [shouldFetch, enabledLeagues]);

  // Sync pinned matches with fresh data and auto-unpin finished games
  useEffect(() => {
    if (pinned.length === 0) return;

    setPinned((prev) => {
      const now = new Date().toISOString();
      const updated = prev
        .map((p) => {
          const latest = events.find((e) => e.id === p.id);
          if (!latest) return p;
          const finishedAt = latest.status.state === 'post' ? p.finishedAt || now : undefined;
          return { ...latest, finishedAt };
        })
        .filter((p) => {
          if (p.status.state !== 'post' || !p.finishedAt) return true;
          const elapsed = Date.now() - new Date(p.finishedAt).getTime();
          return elapsed < AUTO_UNPIN_MINUTES * 60 * 1000;
        });
      return updated;
    });
  }, [events, pinned.length]);

  const toggleLeague = useCallback((slug: string) => {
    setEnabledLeagues((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const pinMatch = useCallback((event: SportEvent) => {
    setPinned((prev) => {
      if (prev.some((p) => p.id === event.id)) return prev;
      return [...prev, event];
    });
  }, []);

  const unpinMatch = useCallback((id: string) => {
    setPinned((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      events,
      pinned,
      loading,
      error,
      enabledLeagues,
      toggleLeague,
      pinMatch,
      unpinMatch,
      registerInterest,
      unregisterInterest,
    }),
    [
      events,
      pinned,
      loading,
      error,
      enabledLeagues,
      toggleLeague,
      pinMatch,
      unpinMatch,
      registerInterest,
      unregisterInterest,
    ]
  );

  return (
    <SportsContext.Provider value={value}>{children}</SportsContext.Provider>
  );
}

export function useSports(): SportsContextValue {
  const ctx = useContext(SportsContext);
  if (!ctx) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  return ctx;
}

export function useSportsScoreboard(): SportsContextValue {
  const ctx = useSports();
  const { registerInterest, unregisterInterest } = ctx;

  useEffect(() => {
    registerInterest();
    return () => {
      unregisterInterest();
    };
  }, [registerInterest, unregisterInterest]);

  return ctx;
}
