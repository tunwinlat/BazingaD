'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Pin,
  Settings2,
  X,
  Loader2,
} from 'lucide-react';
import { useSportsScoreboard } from '@/components/SportsContext';
import {
  SPORTS_LEAGUES,
  getSportsLeague,
  formatEventStatus,
  type SportEvent,
} from '@/lib/sports';

export default function SportsScoreboard() {
  const {
    events,
    pinned,
    loading,
    enabledLeagues,
    toggleLeague,
    pinMatch,
    unpinMatch,
  } = useSportsScoreboard();
  const [showSettings, setShowSettings] = useState(false);

  const pinnedIds = new Set(pinned.map((p) => p.id));

  const grouped = useMemo(() => {
    const filtered = events.filter((e) => enabledLeagues.includes(e.leagueSlug));
    const order = { in: 0, pre: 1, post: 2 };

    const sorted = [...filtered].sort((a, b) => {
      if (order[a.status.state] !== order[b.status.state]) {
        return order[a.status.state] - order[b.status.state];
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const map = new Map<string, SportEvent[]>();
    for (const event of sorted) {
      const list = map.get(event.leagueSlug) || [];
      list.push(event);
      map.set(event.leagueSlug, list);
    }
    return map;
  }, [events, enabledLeagues]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-white/90">Live Scores</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="p-1 rounded-md transition-colors hover:bg-white/10 text-white/50 hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Choose leagues"
          title="Choose leagues"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-5 text-xs text-white/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading scores…
        </div>
      ) : grouped.size === 0 ? (
        <div className="text-center py-5 text-xs text-white/40">
          No matches for selected leagues
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([slug, leagueEvents]) => {
            const league = getSportsLeague(slug);
            return (
              <div key={slug}>
                <div
                  className="flex items-center gap-1.5 mb-1.5"
                  title={league?.name}
                >
                  <span className="text-base leading-none">{league?.icon}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    {league?.abbreviation}
                  </span>
                </div>
                <div className="space-y-2">
                  {leagueEvents.map((event) => (
                    <MatchCard
                      key={event.id}
                      event={event}
                      isPinned={pinnedIds.has(event.id)}
                      onPin={() => pinMatch(event)}
                      onUnpin={() => unpinMatch(event.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSettings && (
        <LeagueSettingsModal
          enabled={enabledLeagues}
          onToggle={toggleLeague}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function MatchCard({
  event,
  isPinned,
  onPin,
  onUnpin,
}: {
  event: SportEvent;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const isLive = event.status.state === 'in';
  const statusText = formatEventStatus(event);

  return (
    <div
      className="rounded-lg p-2 transition-colors hover:bg-white/[0.03]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.22)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isLive && <LiveDot />}
          <span
            className={`text-[10px] font-medium whitespace-nowrap ${
              isLive ? 'text-emerald-400' : 'text-white/45'
            }`}
          >
            {statusText}
          </span>
        </div>
        <button
          type="button"
          onClick={isPinned ? onUnpin : onPin}
          disabled={!isLive && !isPinned}
          className="p-1 rounded-md transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          style={{ color: isPinned ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}
          aria-label={isPinned ? 'Unpin match' : 'Pin match'}
          title={isPinned ? 'Unpin match' : 'Pin match'}
        >
          <Pin className="w-3 h-3" fill={isPinned ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="space-y-1">
        <TeamLine team={event.away} />
        <TeamLine team={event.home} />
      </div>
    </div>
  );
}

function TeamLine({ team }: { team: SportEvent['home'] }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt={team.abbreviation}
            className="w-5 h-5 object-contain flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            {team.abbreviation.slice(0, 2)}
          </div>
        )}
        <span className="text-xs text-white/90 truncate">
          {team.shortName || team.name}
        </span>
      </div>
      <span className="text-xs font-bold text-white tabular-nums">
        {team.score}
      </span>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  );
}

function LeagueSettingsModal({
  enabled,
  onToggle,
  onClose,
}: {
  enabled: string[];
  onToggle: (slug: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xs rounded-2xl p-5 shadow-2xl"
        style={{
          backgroundColor: 'rgba(22, 22, 38, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Leagues
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
          {SPORTS_LEAGUES.map((league) => {
            const checked = enabled.includes(league.slug);
            return (
              <button
                key={league.slug}
                type="button"
                onClick={() => onToggle(league.slug)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className="min-w-0">
                  <span className="text-sm text-white/90 flex items-center gap-2">
                    <span className="text-base">{league.icon}</span>
                    <span className="font-medium truncate">{league.abbreviation}</span>
                  </span>
                  <span className="block text-[10px] text-white/40 truncate">
                    {league.name}
                  </span>
                </span>
                <div
                  className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ml-2 ${
                    checked ? 'bg-indigo-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      checked ? 'translate-x-4' : ''
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
